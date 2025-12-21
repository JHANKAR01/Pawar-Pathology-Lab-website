
// Configuration check for Google Drive environment variables
console.log('--- Google Drive Configuration Check ---');

const checkEnvVar = (varName: string) => {
  if (!process.env[varName]) {
    console.log(`${varName}: MISSING`);
    throw new Error(`Google Drive: Missing environment variable: ${varName}`);
  }
  console.log(`${varName}: LOADED`);
};

checkEnvVar('GOOGLE_CLIENT_ID');
checkEnvVar('GOOGLE_CLIENT_SECRET');
checkEnvVar('GOOGLE_REFRESH_TOKEN');
checkEnvVar('GOOGLE_DRIVE_FOLDER_ID');

console.log('--- Configuration Check Complete ---');

import { google } from 'googleapis';
import { Readable } from 'stream';
import { Buffer } from 'buffer';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost' // This redirect URI is often required but not strictly used for refresh token flow
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * Searches for a folder by name within a parent folder. If not found, creates it.
 * Returns the folder ID.
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
  } catch (error) {
    console.error(`Error in getOrCreateFolder for name "${name}" and parent "${parentId}":`, error);
    throw error;
  }
}

/**
 * Uploads a file buffer to a nested Google Drive folder structure.
 * Returns the webViewLink (viewable URL) and fileId.
 */
export async function uploadReportToDrive(
  fileBuffer: Buffer, 
  fileName: string, 
  mimeType: string,
  patientName: string // Added for nested folder path
) {
  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!rootFolderId) {
      throw new Error('GOOGLE_DRIVE_FOLDER_ID is not defined in .env');
    }
    console.log('Targeting Root Folder ID:', rootFolderId); // Diagnostic log

    // 1. Create nested folder path: Year > Month > Day > Patient Name
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = now.toLocaleString('default', { month: 'long' }); // e.g., "December"
    const day = now.getDate().toString();

    const yearFolderId = await getOrCreateFolder(year, rootFolderId);
    const monthFolderId = await getOrCreateFolder(month, yearFolderId);
    const dayFolderId = await getOrCreateFolder(day, monthFolderId);
    // Sanitize patient name to be a valid folder name
    const sanitizedPatientName = patientName.replace(/[^a-zA-Z0-9 ]/g, '_');
    const patientFolderId = await getOrCreateFolder(sanitizedPatientName, dayFolderId);

    // 2. Upload the file to the final patient folder
    const fileMetadata = {
      name: fileName,
      parents: [patientFolderId],
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

    // 3. Make the file publicly viewable
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return {
      fileId: fileId,
      webViewLink: file.data.webViewLink,
      webContentLink: file.data.webContentLink,
    };

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}
