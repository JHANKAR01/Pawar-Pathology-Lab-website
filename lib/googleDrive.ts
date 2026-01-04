
import { google } from 'googleapis';
import { Readable } from 'stream';
import { Buffer } from 'buffer';
import DriveFolder from '@/models/DriveFolder'; // Importing the model

const SCOPES = ['https://www.googleapis.com/auth/drive'];

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
  throw new Error('CRITICAL: Google Drive credentials missing in .env');
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  undefined
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * Helper: Search or Create Folder
 */
async function getOrCreateFolder(name: string, parentId: string): Promise<string> {
  const query = `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  try {
    const res = await drive.files.list({
      q: query,
      fields: 'files(id)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0 && res.data.files[0].id) {
      return res.data.files[0].id;
    } else {
      const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      };
      const folder = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });
      if (!folder.data.id) throw new Error(`Failed to create folder '${name}'`);
      return folder.data.id;
    }
  } catch (error: any) {
    console.error(`Error in getOrCreateFolder for name "${name}" and parent "${parentId}":`, error);
    throw error;
  }
}

/**
 * Provision Month Folders (Batch Optimization)
 * Creates: Year Folder -> Month Folder -> Daily Folders (01, 02... 31)
 * Caches IDs in MongoDB to prevent future API searches.
 */
export async function provisionMonthFolders(year: number, monthName: string, daysInMonth: number) {
  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootFolderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is missing');

    const monthKey = `${year}-${monthName.toUpperCase().slice(0, 3)}`; // e.g., 2026-JAN

    // Check if already provisioned
    const existing = await DriveFolder.findOne({ monthKey });
    if (existing) return { success: true, message: 'Already provisioned' };

    // 1. Ensure Year Folder
    const yearFolderId = await getOrCreateFolder(year.toString(), rootFolderId);

    // 2. Ensure Month Folder
    const monthFolderId = await getOrCreateFolder(monthName, yearFolderId);

    // 3. Batched Creation of Daily Folders
    const dailyFoldersData = [];

    // We can't actually "batch" create in one API call, but we can parallelize or just loop. 
    // Loop is safer for rate limits.
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = i.toString().padStart(2, '0');
      // Naming convention: "01" or "01 - Monday" (Simple "01" is better for sorting)
      // Let's stick to simple "DD" format as per previous robust logic, or "DD"
      const dayFolderId = await getOrCreateFolder(dayStr, monthFolderId);
      dailyFoldersData.push({ date: dayStr, folderId: dayFolderId });

      // Small delay to be kind to API rate limits if needed, usually google handles it ok for small burst
      await new Promise(r => setTimeout(r, 200));
    }

    // 4. Save to DB
    await DriveFolder.create({
      monthKey,
      parentFolderId: monthFolderId,
      dailyFolders: dailyFoldersData
    });

    return { success: true, message: `Provisioned ${daysInMonth} folders for ${monthKey}` };

  } catch (error) {
    console.error('Provisioning Error:', error);
    throw error;
  }
}


/**
 * Uploads a report with Smart Caching Strategy.
 * 1. Checks MongoDB for cached daily folder ID.
 * 2. If missing, falls back to `getOrCreateFolder` (Fail-Safe).
 * 3. Uses Standardized Name: [Patient]_[Tests]_[Date]_[Time].pdf
 */
export async function uploadReportToDrive(
  fileBuffer: Buffer,
  mimeType: string,
  patientName: string,
  testTitles: string[],
  bookingId: string
) {
  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootFolderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is missing');

    const now = new Date();
    const year = now.getFullYear();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const day = String(now.getDate()).padStart(2, '0');
    const monthKey = `${year}-${monthName.toUpperCase().slice(0, 3)}`; // 2026-JAN

    // A. Attempt Cache Retrieval
    let targetFolderId = '';
    const cachedRecord = await DriveFolder.findOne({ monthKey });

    if (cachedRecord) {
      const dayRecord = cachedRecord.dailyFolders.find((f: any) => f.date === day);
      if (dayRecord) {
        targetFolderId = dayRecord.folderId;
        console.log(`[Drive] Cache Hit for ${day}-${monthName}`);
      }
    }

    // B. Fail-Safe / Fallback (No Cache)
    if (!targetFolderId) {
      console.warn(`[Drive] Cache Miss for ${monthKey}-${day}. Using API fallback.`);
      const yearId = await getOrCreateFolder(year.toString(), rootFolderId);
      const monthId = await getOrCreateFolder(monthName, yearId);
      targetFolderId = await getOrCreateFolder(day, monthId);
    }

    // C. Patient Name Sanitization & Standardized Filename
    // Name: [PatientName]_[Combined_Tests]_[YYYY-MM-DD]_[HH-mm].pdf
    const safeName = patientName.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
    const safeTests = testTitles.join('+').replace(/[^a-zA-Z0-9\+]/g, '').slice(0, 50); // truncated
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${day}`;

    // Note: User asked for [PatientName]_[Combined_Tests]_[YYYY-MM-DD]_[HH-mm].pdf
    // But we also need unique ID or booking ID to prevent collisions? 
    // The prompt naming convention "PatientName_CombinedTests_YYYY-MM-DD_HH-mm.pdf" 
    // is specific. I will append bookingId suffix just in case to be safe if multiple identical uploads happen same minute? 
    // Prompt said: "[PatientName]_[Combined_Tests]_[YYYY-MM-DD]_[HH-mm].pdf" EXACTLY.
    // I shall strictly follow the prompt, but collision risk exists.
    // Wait, prompt in Phase 4 says: "Every uploaded file must be named using this exact flow: [PatientName]_[Combined_Tests]_[YYYY-MM-DD]_[HH-mm].pdf"
    // I will follow STRICT flow.

    const automatedFileName = `${safeName}_${safeTests}_${dateStr}_${timeStr}.pdf`;

    // 1. Create Patient Sub-folder? 
    // Prompt PHASE 4 says: "Modify the function to first check MongoDB for the current date's folderId. If it exists, upload the file directly to that ID."
    // It DOES NOT explicitly say "create a patient subfolder" anymore in step 2.
    // However, the *original* logic created a patient subfolder.
    // "Direct Upload: Modify the function to first check MongoDB for the current date's folderId. If it exists, upload the file directly to that ID."
    // "Deep Nesting: Year > Month > Day > Patient Name" was in the previous code comments.
    // If I upload DIRECTLY to the Day folder (targetFolderId), it flatly lists all PDFs.
    // The previous code had: "Patient Name Sanitization... patientFolderId = await getOrCreateFolder(sanitizedPatientName, dayFolderId);"
    // Re-reading Phase 4 Spec: "Basic Provisioning Logic: ... creates a parent folder (YYYY-MMM) and sub-folders for every day... Save these generated IDs... upload the file directly to [the date's] ID."
    // It implies uploading directly to the Day folder is the goal to save 'Search' calls (creating patient folder requires a Search/Create call every single time!).
    // So to save API limits (90%+), we MUST skip creating per-patient folders.
    // So I will upload FILE directly to `targetFolderId` (Day Folder).

    const fileMetadata = {
      name: automatedFileName,
      parents: [targetFolderId],
    };

    const media = {
      mimeType: mimeType,
      body: Readable.from(fileBuffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = file.data.id;
    if (!fileId) throw new Error('Google Drive upload failed: No ID returned');

    return {
      fileId: fileId,
      webViewLink: file.data.webViewLink,
      webContentLink: file.data.webContentLink,
    };

  } catch (error: any) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}
