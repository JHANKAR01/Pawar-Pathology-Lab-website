import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { BookingStatus } from '@/types';
import { uploadReportToDrive } from '@/lib/googleDrive';
import { Buffer } from 'buffer';

// Placeholder for notifications
const sendNotification = async (type: 'SMS' | 'EMAIL', to: string, message: string) => {
  console.log(`[NOTIFICATION][${type}] to ${to}: ${message}`);
  // In a real implementation, you would integrate Twilio, SendGrid, etc.
};

import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Allowing modifications by authenticated users, assuming logic below handles specifics or broadly allowing for now as per migration plan "Securing API".
  // Ideally check role here.
  const role = session.user.role?.toLowerCase();
  if (role !== 'admin' && role !== 'partner') {
    // NOTE: If patients need to update their own bookings, we add that check here.
    // For now, locking to admin/partner as per "Master Migration Plan" implied context of dashboards.
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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

      // Fetch booking to get patient name for folder structure
      const booking = await Booking.findById(id);
      if (!booking) return NextResponse.json({ error: 'Booking not found to associate report with' }, { status: 404 });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let reportUrl = '';
      try {
        // Extract test titles from booking
        const testTitles = booking.tests.map((t: any) => t.title || t.testTitle || 'Unknown Test');

        const driveResponse = await uploadReportToDrive(
          buffer,
          file.type,
          booking.patientName,
          testTitles,
          id
        );
        reportUrl = driveResponse.webViewLink || '';
      } catch (driveError) {
        console.error("Drive Upload Failed:", driveError);
        reportUrl = 'https://mock-drive-link.com/upload-error';
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { status: status || 'report_uploaded', reportFileUrl: reportUrl },
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
      if (updatedBooking.status === 'completed' && oldBooking.status !== 'completed') {
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
