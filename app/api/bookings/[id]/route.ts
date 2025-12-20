
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { uploadReportToDrive } from '@/lib/googleDrive';
// Fix: Import Buffer from 'buffer' to resolve 'Cannot find name Buffer' error
import { Buffer } from 'buffer';

// PATCH /api/bookings/[id] - Update status or Upload Report
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const { id } = params;

  try {
    // Check Content-Type to determine if this is a JSON update or a File Upload
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // --- Handle File Upload (Partner Dashboard) ---
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const status = formData.get('status') as string;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      // Fix: Use Buffer.from with imported Buffer to ensure it is found by the compiler
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Google Drive
      // Note: In production, ensure GOOGLE credentials are set, otherwise wrap in try/catch or use dummy link
      let reportUrl = '';
      try {
        const driveResponse = await uploadReportToDrive(
            buffer, 
            `Report_${id}_${Date.now()}.pdf`, 
            file.type
        );
        reportUrl = driveResponse.webViewLink || '';
      } catch (driveError) {
        console.error("Drive Upload Failed (Check .env):", driveError);
        // Fallback for development if keys aren't set
        reportUrl = 'https://mock-drive-link.com/error-check-logs'; 
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { 
          status: status || 'report_uploaded',
          reportFileUrl: reportUrl
        },
        { new: true }
      );

      return NextResponse.json(updatedBooking);

    } else {
      // --- Handle JSON Status Update (Admin/Logic) ---
      const body = await request.json();
      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true }
      );
      
      if (!updatedBooking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      return NextResponse.json(updatedBooking);
    }

  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
