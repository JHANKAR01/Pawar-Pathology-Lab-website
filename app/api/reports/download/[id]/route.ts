
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { google } from 'googleapis';

import { withRateLimit } from '@/lib/withRateLimit';

async function handler(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bookingId = params.id;
        await dbConnect();

        // Fetch booking to verify ownership/permissions
        // Note: We need reportFileId or parse it from reportFileUrl if not stored separately yet
        // Phase 1/2 ensured we added reportFileId to model, but existing data might rely on URL
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const userRole = session.user.role?.toLowerCase();
        const userId = session.user.id;

        // Access Control
        const isOwner = booking.userId === userId;
        const isAdmin = userRole === 'admin';
        const isPartner = userRole === 'partner'; // Partners might need restrictive access, but generally can view reports they manage

        if (!isOwner && !isAdmin && !isPartner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Extract File ID
        // Priority: booking.reportFileId -> extract from booking.reportFileUrl
        let fileId = booking.reportFileId;

        if (!fileId && booking.reportFileUrl) {
            // Fallback: Try to extract ID from standard Google Drive URL patterns
            // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
            const match = booking.reportFileUrl.match(/\/d\/(.+?)\//);
            if (match && match[1]) {
                fileId = match[1];
            }
        }

        if (!fileId) {
            return NextResponse.json({ error: 'Report file ID not found' }, { status: 404 });
        }

        // Initialize Google Drive Client
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Stream the file
        const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        // Create a new headers object (HeadersInit compatible)
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `inline; filename="report-${bookingId}.pdf"`);

        // Stream to response
        // @ts-ignore: response.data is a readable stream
        return new NextResponse(response.data, { headers });

    } catch (error) {
        console.error('Download Proxy Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Cast handler to any because withRateLimit expects NextRequest but dynamic routes receive params as 2nd arg
// The wrapper passes arguments through, so it works at runtime.
export const GET = withRateLimit(handler as any);
