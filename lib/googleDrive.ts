
import { google } from 'googleapis';
import { Readable } from 'stream';
import { Buffer } from 'buffer';
import DriveFolder from '@/models/DriveFolder';

// ============================================================================
// PROVIDER PATTERN: Google Drive Providers
// ============================================================================

export interface DriveUploadResult {
  fileId: string;
  webViewLink?: string;
  webContentLink?: string;
}

/**
 * Drive Provider Interface
 */
export interface DriveProvider {
  uploadFile(
    fileBuffer: Buffer,
    mimeType: string,
    metadata: {
      patientName: string;
      testTitles: string[];
      bookingId: string;
      referredBy?: string;
      email?: string;
    }
  ): Promise<DriveUploadResult>;

  shareFolder(folderId: string, email: string): Promise<void>;
}

/**
 * DummyDriveProvider - Returns mock data for development/testing
 */
class DummyDriveProvider implements DriveProvider {
  async uploadFile(
    fileBuffer: Buffer,
    mimeType: string,
    metadata: { patientName: string; testTitles: string[]; bookingId: string; referredBy?: string; email?: string }
  ): Promise<DriveUploadResult> {
    const mockId = `mock_file_${Date.now()}`;
    console.log(`[DUMMY DRIVE] Upload simulated for ${metadata.patientName} | Size: ${fileBuffer.length} bytes`);

    if (metadata.email) {
      console.log(`[DUMMY DRIVE] Sharing folder with ${metadata.email}`);
    }

    return {
      fileId: mockId,
      webViewLink: `https://drive.google.com/file/d/${mockId}/view`,
      webContentLink: `https://drive.google.com/uc?id=${mockId}`
    };
  }

  async shareFolder(folderId: string, email: string): Promise<void> {
    console.log(`[DUMMY DRIVE] Executing shareFolder(${folderId}, ${email})`);
  }
}

/**
 * RealDriveProvider - Actual Google Drive implementation
 */
class RealDriveProvider implements DriveProvider {
  private drive;
  private oauth2Client;

  constructor() {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
      throw new Error('CRITICAL: Google Drive credentials missing in .env');
    }

    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      undefined
    );

    this.oauth2Client.setCredentials({
      refresh_token: GOOGLE_REFRESH_TOKEN,
    });

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  private async getOrCreateFolder(name: string, parentId: string): Promise<string> {
    const query = `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await this.drive.files.list({
      q: query,
      fields: 'files(id)',
      spaces: 'drive',
    });

    if (res.data.files && res.data.files.length > 0 && res.data.files[0].id) {
      return res.data.files[0].id;
    }

    const fileMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    };
    const folder = await this.drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    if (!folder.data.id) throw new Error(`Failed to create folder '${name}'`);
    return folder.data.id;
  }

  async shareFolder(folderId: string, email: string): Promise<void> {
    try {
      await this.drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: 'reader',
          type: 'user',
          emailAddress: email,
        },
        emailMessage: 'Your pathology report from Pawar Lab is ready.',
        sendNotificationEmail: true,
      });
    } catch (error) {
      console.error(`Failed to share folder ${folderId} with ${email}:`, error);
      // Don't throw - sharing failure shouldn't block the upload process
    }
  }

  private getDayFolderName(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${day}-${dayName}`;
  }

  async uploadFile(
    fileBuffer: Buffer,
    mimeType: string,
    metadata: {
      patientName: string;
      testTitles: string[];
      bookingId: string;
      referredBy?: string;
      email?: string;
    }
  ): Promise<DriveUploadResult> {
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootFolderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is missing');

    const { patientName, testTitles, referredBy = 'Self', email } = metadata;

    const now = new Date();
    const year = now.getFullYear();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const monthKey = `${year}-${monthName.toUpperCase().slice(0, 3)}`;

    // 1. Resolve Day Folder (Cache or Create)
    let dayFolderId = '';
    const cachedRecord = await DriveFolder.findOne({ monthKey });

    // Day Name logic: "05-Monday"
    const dayFolderName = this.getDayFolderName(now);
    // Note: The cache stores simple '05', '06'. We might need to update cache logic or fallback to on-the-fly creation for new naming structure.
    // For safety in this transition, we'll try to find/create the day folder manually if cache structure mismatch.

    if (cachedRecord) {
      const dayRecord = cachedRecord.dailyFolders.find((f: any) => f.date === String(now.getDate()).padStart(2, '0'));
      // Check if this cached folder actually has the right name? 
      // If we change naming convention, old cache IDs might point to folders named just "05".
      // We'll proceed with hierarchical check to be safe.
      if (dayRecord) {
        // Optimization: We could trust the ID, but let's verify if we want strict "05-Monday" structure.
        // If we are strict, we might ignore legacy cache for now or just use it.
        // Let's assume we want to enforce the new structure, so we might skip weak cache.
        // But to avoid breaking existing flows, we can use getOrCreateFolder.
      }
    }

    const yearId = await this.getOrCreateFolder(year.toString(), rootFolderId);
    const monthId = await this.getOrCreateFolder(monthName, yearId);
    dayFolderId = await this.getOrCreateFolder(dayFolderName, monthId);

    // 2. Create Patient-Specific Folder
    // Name: "PatientName Email TestNames"
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9 @.]/g, '_').replace(/_+/g, '_').trim();
    const safePatient = sanitize(patientName);
    const safeTests = sanitize(testTitles.join('_')).slice(0, 30);
    const safeEmail = email ? sanitize(email) : 'NoEmail';

    const patientFolderName = `${safePatient} ${safeEmail} ${safeTests}`;
    const patientFolderId = await this.getOrCreateFolder(patientFolderName, dayFolderId);

    // 3. Share with Patient
    if (email) {
      await this.shareFolder(patientFolderId, email);
    }

    // 4. Upload File
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStamp = `${hours}-${minutes}-${seconds}`;

    // Name: "YYYY-MM-DD_HH-mm-ss_Patient_Tests_Ref.pdf"
    const dateStamp = `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const automatedFileName = `${dateStamp}_${timeStamp}_${safePatient}_${safeTests}_${sanitize(referredBy)}.pdf`;

    const file = await this.drive.files.create({
      requestBody: {
        name: automatedFileName,
        parents: [patientFolderId], // Upload to PATIENT folder, not Day folder
      },
      media: {
        mimeType,
        body: Readable.from(fileBuffer),
      },
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = file.data.id;
    if (!fileId) throw new Error('Google Drive upload failed: No ID returned');

    return {
      fileId,
      webViewLink: file.data.webViewLink || undefined,
      webContentLink: file.data.webContentLink || undefined,
    };
  }
}

/**
 * Factory function to get the appropriate drive provider
 */
export function getDriveProvider(): DriveProvider {
  if (process.env.NODE_ENV === 'development' && process.env.USE_DUMMY_PROVIDERS === 'true') {
    return new DummyDriveProvider();
  }
  return new RealDriveProvider();
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

// ============================================================================
// BATCH PROVISIONING (Refactored for 10-day look-ahead)
// ============================================================================

export async function provisionNextBatch(daysToProvision: number = 10) {
  const provider = getDriveProvider();

  if (process.env.NODE_ENV === 'development' && process.env.USE_DUMMY_PROVIDERS === 'true') {
    return { success: true, message: '[DUMMY] Provisioning 10 days simulated', lastProvisionedDate: new Date() };
  }

  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootFolderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is missing');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    undefined
  );
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Helper to ensure folder exists
  const getOrCreateFolder = async (name: string, parentId: string): Promise<string> => {
    const query = `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const res = await drive.files.list({ q: query, fields: 'files(id)', spaces: 'drive' });
    if (res.data.files && res.data.files.length > 0 && res.data.files[0].id) {
      return res.data.files[0].id;
    }
    const folder = await drive.files.create({
      requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
      fields: 'id',
    });
    if (!folder.data.id) throw new Error(`Failed to create folder '${name}'`);
    return folder.data.id;
  };

  // 1. Determine Start Date
  // Check settings or find latest from DriveFolder model
  // Ideally, read from Settings. If not set, use today.
  // We'll import Settings dynamically to avoid circular deps if any, or just query it.
  const Settings = (await import('@/models/Settings')).default;
  const settings = await Settings.getSingleton();

  let startDate = settings.lastProvisionedDate ? new Date(settings.lastProvisionedDate) : new Date();

  // If last provisioned is in the past, start from tomorrow? Or just continue from last provisioned + 1.
  // If undefined, start from today + 1.
  startDate.setDate(startDate.getDate() + 1);

  let lastDate: Date = startDate;

  for (let i = 0; i < daysToProvision; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + i);

    const year = targetDate.getFullYear();
    const monthName = targetDate.toLocaleString('default', { month: 'long' });
    const monthKey = `${year}-${monthName.toUpperCase().slice(0, 3)}`;

    // Create Year/Month
    const yearId = await getOrCreateFolder(year.toString(), rootFolderId);
    const monthId = await getOrCreateFolder(monthName, yearId);

    // Create Day: "05-Monday"
    const dayStr = String(targetDate.getDate()).padStart(2, '0');
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    const fullDayFolderName = `${dayStr}-${dayName}`;

    const dayFolderId = await getOrCreateFolder(fullDayFolderName, monthId);

    // Update Cache
    await DriveFolder.findOneAndUpdate(
      { monthKey },
      {
        $setOnInsert: { parentFolderId: monthId },
        $addToSet: { dailyFolders: { date: dayStr, folderId: dayFolderId } } // Use $addToSet to avoid dupes
      },
      { upsert: true, new: true }
    );

    lastDate = targetDate;
    await new Promise(r => setTimeout(r, 200)); // Rate limit
  }

  // Update Settings
  await Settings.findByIdAndUpdate(settings._id, { lastProvisionedDate: lastDate });

  return {
    success: true,
    message: `Provisioned ${daysToProvision} days until ${lastDate.toDateString()}`,
    lastProvisionedDate: lastDate
  };
}

/**
 * Legacy upload function - wraps the new provider pattern
 */
export async function uploadReportToDrive(
  fileBuffer: Buffer,
  mimeType: string,
  patientName: string,
  testTitles: string[],
  bookingId: string,
  referredBy: string = 'Self',
  email?: string // Added email argument
) {
  const provider = getDriveProvider();
  return provider.uploadFile(fileBuffer, mimeType, { patientName, testTitles, bookingId, referredBy, email });
}
