
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
    metadata: { patientName: string; testTitles: string[]; bookingId: string; referredBy?: string }
  ): Promise<DriveUploadResult>;
}

/**
 * DummyDriveProvider - Returns mock data for development/testing
 */
class DummyDriveProvider implements DriveProvider {
  async uploadFile(
    fileBuffer: Buffer,
    mimeType: string,
    metadata: { patientName: string; testTitles: string[]; bookingId: string; referredBy?: string }
  ): Promise<DriveUploadResult> {
    const mockId = `mock_file_${Date.now()}`;
    console.log(`[DUMMY DRIVE] Upload simulated for ${metadata.patientName} | Size: ${fileBuffer.length} bytes`);
    return {
      fileId: mockId,
      webViewLink: `https://drive.google.com/file/d/${mockId}/view`,
      webContentLink: `https://drive.google.com/uc?id=${mockId}`
    };
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

  async uploadFile(
    fileBuffer: Buffer,
    mimeType: string,
    metadata: { patientName: string; testTitles: string[]; bookingId: string; referredBy?: string }
  ): Promise<DriveUploadResult> {
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootFolderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is missing');

    const { patientName, testTitles, referredBy = 'Self' } = metadata;

    const now = new Date();
    const year = now.getFullYear();
    const monthName = now.toLocaleString('default', { month: 'long' });
    const day = String(now.getDate()).padStart(2, '0');
    const monthKey = `${year}-${monthName.toUpperCase().slice(0, 3)}`;

    // Cache Retrieval
    let targetFolderId = '';
    const cachedRecord = await DriveFolder.findOne({ monthKey });

    if (cachedRecord) {
      const dayRecord = cachedRecord.dailyFolders.find((f: any) => f.date === day);
      if (dayRecord) {
        targetFolderId = dayRecord.folderId;
      }
    }

    // Fallback
    if (!targetFolderId) {
      const yearId = await this.getOrCreateFolder(year.toString(), rootFolderId);
      const monthId = await this.getOrCreateFolder(monthName, yearId);
      targetFolderId = await this.getOrCreateFolder(day, monthId);
    }

    // Forensic-Grade Filename
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dayStr = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const dateStamp = `${year}-${month}-${dayStr}`;
    const timeStamp = `${hours}-${minutes}-${seconds}`;
    const safeName = sanitize(patientName);
    const safeTests = sanitize(testTitles.join('_')).slice(0, 50);
    const safeRefBy = sanitize(referredBy);

    const automatedFileName = `${dateStamp}_${timeStamp}_${safeName}_${safeTests}_${safeRefBy}.pdf`;

    const file = await this.drive.files.create({
      requestBody: {
        name: automatedFileName,
        parents: [targetFolderId],
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

const SCOPES = ['https://www.googleapis.com/auth/drive'];

/**
 * Provision Month Folders (Batch Optimization)
 */
export async function provisionMonthFolders(year: number, monthName: string, daysInMonth: number) {
  const provider = getDriveProvider();

  // For provisioning, we need direct access - bypass provider for this admin function
  if (process.env.NODE_ENV === 'development' && process.env.USE_DUMMY_PROVIDERS === 'true') {
    return { success: true, message: '[DUMMY] Provisioning simulated' };
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

  const monthKey = `${year}-${monthName.toUpperCase().slice(0, 3)}`;

  const existing = await DriveFolder.findOne({ monthKey });
  if (existing) return { success: true, message: 'Already provisioned' };

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

  const yearFolderId = await getOrCreateFolder(year.toString(), rootFolderId);
  const monthFolderId = await getOrCreateFolder(monthName, yearFolderId);

  const dailyFoldersData = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = i.toString().padStart(2, '0');
    const dayFolderId = await getOrCreateFolder(dayStr, monthFolderId);
    dailyFoldersData.push({ date: dayStr, folderId: dayFolderId });
    await new Promise(r => setTimeout(r, 200));
  }

  await DriveFolder.create({ monthKey, parentFolderId: monthFolderId, dailyFolders: dailyFoldersData });

  return { success: true, message: `Provisioned ${daysInMonth} folders for ${monthKey}` };
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
  referredBy: string = 'Self'
) {
  const provider = getDriveProvider();
  return provider.uploadFile(fileBuffer, mimeType, { patientName, testTitles, bookingId, referredBy });
}
