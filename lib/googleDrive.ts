
import { google } from 'googleapis';
import { Readable } from 'stream';
// Fix: Import Buffer from 'buffer' to resolve 'Cannot find name Buffer' in environments without global Node.js types
import { Buffer } from 'buffer';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/**
 * Authenticate with Google using Service Account Credentials
 * stored in environment variables.
 */
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // Handle newline characters in private key string for Next.js env vars
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Uploads a file buffer to a specific Google Drive folder.
 * Returns the webViewLink (viewable URL) and fileId.
 */
export async function uploadReportToDrive(
  // Fix: Explicitly using Buffer type from 'buffer' module
  fileBuffer: Buffer, 
  fileName: string, 
  mimeType: string
) {
  try {
    // 1. Upload the file
    const fileMetadata = {
      name: fileName,
      // Optional: Set a specific folder ID if defined in env, otherwise root
      parents: process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : [],
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

    // 2. Make the file publicly viewable (read-only) so the patient can see it via link
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return {
      fileId: fileId,
      webViewLink: file.data.webViewLink, // URL to view in browser
      webContentLink: file.data.webContentLink, // URL to download
    };

  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
}
