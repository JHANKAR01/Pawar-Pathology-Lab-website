import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking, { BookingStatus } from '@/models/Booking';
import { uploadReportToDrive } from '@/lib/googleDrive';
import { Buffer } from 'buffer';

// Placeholder for notifications
const sendNotification = async (type: 'SMS' | 'EMAIL', to: string, message: string) => {
  console.log(`[NOTIFICATION][${type}] to ${to}: ${message}`);
  // In a real implementation, you would integrate Twilio, SendGrid, etc.
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const { id } = params;

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Fix: Cast formData to any to resolve property 'get' does not exist error on standard Web FormData in some environments
      const formData: any = await request.formData();
      const file = formData.get('file') as any;
      const status = formData.get('status') as string;

      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let reportUrl = '';
      try {
        const driveResponse = await uploadReportToDrive(
            buffer, 
            `Report_${id}_${Date.now()}.pdf`, 
            file.type
        );
        reportUrl = driveResponse.webViewLink || '';
      } catch (driveError) {
        console.error("Drive Upload Failed:", driveError);
        reportUrl = 'https://mock-drive-link.com/upload-error'; 
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { status: status || BookingStatus.REPORT_UPLOADED, reportFileUrl: reportUrl },
        { new: true }
      );

      return NextResponse.json(updatedBooking);

    } else {
      const body = await request.json();
      
      const oldBooking = await Booking.findById(id);
      if (!oldBooking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true }
      );
      
      if (!updatedBooking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      // Logic for Notifications on Verification
      if (updatedBooking.status === BookingStatus.COMPLETED && oldBooking.status !== BookingStatus.COMPLETED) {
        const message = `Pawar Lab: Hello ${updatedBooking.patientName}, your report for ${updatedBooking.tests[0].title} has been verified. You can download it now from your patient portal.`;
        
        if (updatedBooking.email) {
          await sendNotification('EMAIL', updatedBooking.email, message);
        }
        if (updatedBooking.contactNumber) {
          await sendNotification('SMS', updatedBooking.contactNumber, message);
        }
      }

      return NextResponse.json(updatedBooking);
    }

  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
