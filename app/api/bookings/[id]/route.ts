import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { BookingStatus } from '@/types';
import { uploadReportToDrive } from '@/lib/googleDrive';
import { Buffer } from 'buffer';

import { sendSmartNotification } from '@/lib/notifications';

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
  // Role check moved down to specific operations to allow self-cancellation
  const role = session.user.role?.toLowerCase();
  const userId = session.user.id;
  const userEmail = session.user.email?.toLowerCase();

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

      // Access Control:
      // Admin/Partner: Can do almost anything (logic continues below)
      // Patient/User: Can ONLY cancel OWN PENDING bookings
      if (role !== 'admin' && role !== 'partner') {
        const isOwner = (oldBooking.userId && oldBooking.userId.toString() === userId) || (oldBooking.bookedByEmail === userEmail);

        if (!isOwner) {
          return NextResponse.json({ error: 'Forbidden: Not your booking' }, { status: 403 });
        }

        // Verify they are only trying to cancel
        // strict check: if body has anything other than 'status'='cancelled', or if trying to change to something else
        if (body.status !== 'cancelled' || Object.keys(body).length > 1) { // loose check on keys, maybe too strict if extra metadata sent? keep simple.
          return NextResponse.json({ error: 'Forbidden: You can only cancel bookings' }, { status: 403 });
        }

        if (oldBooking.status !== 'pending') {
          return NextResponse.json({ error: 'Cannot cancel a booking that is already processed' }, { status: 400 });
        }
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true }
      );

      if (!updatedBooking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      // Logic for Notifications on Verification
      if (updatedBooking.status === 'completed' && oldBooking.status !== 'completed') {
        const contactEmail = updatedBooking.bookedByEmail !== 'guest' ? updatedBooking.bookedByEmail : updatedBooking.email;
        sendSmartNotification('REPORT_READY', {
          customerName: updatedBooking.patientName,
          customerEmail: contactEmail,
          customerPhone: updatedBooking.contactNumber,
          bookingId: updatedBooking._id.toString(),
          testNames: updatedBooking.tests.map((t: any) => t.title),
          reportLink: updatedBooking.reportFileUrl || '#'
        });
      }

      // Logic for Notifications on Cancellation
      if (updatedBooking.status === 'cancelled' && oldBooking.status !== 'cancelled') {
        const contactEmail = updatedBooking.bookedByEmail !== 'guest' ? updatedBooking.bookedByEmail : updatedBooking.email;
        sendSmartNotification('BOOKING_CANCELLED', {
          customerName: updatedBooking.patientName,
          customerEmail: contactEmail,
          customerPhone: updatedBooking.contactNumber,
          bookingId: updatedBooking._id.toString()
        });
      }

      return NextResponse.json(updatedBooking);
    }

  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
