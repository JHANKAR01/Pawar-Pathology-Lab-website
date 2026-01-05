import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { BookingStatus } from '@/types';
import { uploadReportToDrive } from '@/lib/googleDrive';
import { Buffer } from 'buffer';

import { sendSmartNotification } from '@/lib/notifications';
import { sanitizeInput } from '@/lib/sanitize';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = session.user.role?.toLowerCase();
  const userId = session.user.id;
  const userEmail = session.user.email?.toLowerCase();

  await dbConnect();
  const { id } = params;

  try {
    const contentType = request.headers.get('content-type') || '';

    // =================================================================================
    // 1. FILE UPLOAD (PARTNER/ADMIN UPLOADING REPORT)
    // =================================================================================
    if (contentType.includes('multipart/form-data')) {
      const formData: any = await request.formData();
      const file = formData.get('file') as any;
      const status = formData.get('status') as string;

      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

      const booking = await Booking.findById(id);
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let reportUrl = '';
      try {
        const testTitles = booking.tests.map((t: any) => t.title || t.testTitle || 'Unknown Test');

        const driveResponse = await uploadReportToDrive(
          buffer,
          file.type,
          booking.patientName,
          testTitles,
          id,
          booking.referredBy || 'Self'
        );
        reportUrl = driveResponse.webViewLink || '';
      } catch (driveError) {
        console.error("Drive Upload Failed:", driveError);
        reportUrl = 'https://mock-drive-link.com/upload-error';
      }

      // Logic: Report Re-upload Reset
      // If report was REJECTED, and new file is uploaded, reset to PENDING_REVIEW
      let finalReportStatus = booking.reportStatus;
      if (booking.reportStatus === 'rejected') {
        finalReportStatus = 'pending_review';
      } else if (!finalReportStatus) {
        finalReportStatus = 'pending_review';
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        {
          status: status || 'report_uploaded',
          reportFileUrl: reportUrl,
          reportStatus: finalReportStatus
        },
        { new: true }
      );

      return NextResponse.json(updatedBooking);

    } else {
      // =================================================================================
      // 2. METADATA UPDATE (JSON)
      // =================================================================================
      const body = await request.json();

      const oldBooking = await Booking.findById(id);
      if (!oldBooking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      // Access Control
      if (role !== 'admin' && role !== 'partner' && role !== 'master') {
        const isOwner = (oldBooking.userId && oldBooking.userId.toString() === userId) || (oldBooking.bookedByEmail === userEmail);
        if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (body.status !== 'cancelled' || Object.keys(body).length > 1) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (oldBooking.status !== 'pending') return NextResponse.json({ error: 'Cannot cancel processed booking' }, { status: 400 });
      }

      // Logic: Partner Assignment & Reassignment
      if (body.assignedPartnerId && body.assignedPartnerId !== oldBooking.assignedPartnerId) {
        // If it was already assigned, this is a REASSIGNMENT
        if (oldBooking.assignedPartnerId) {
          body.status = 'reassigned'; // Auto-set status

          // Notify PREVIOUS Partner
          const oldPartner = await User.findById(oldBooking.assignedPartnerId);
          if (oldPartner && oldPartner.telegramChatId) {
            sendSmartNotification('PARTNER_REASSIGNMENT', {
              bookingId: oldBooking._id.toString(),
              partnerTelegramChatId: oldPartner.telegramChatId
            });
          }
        } else {
          // First time assignment
          body.status = 'assigned';
        }
      }

      // Sanitize
      if (body.patientName) body.patientName = sanitizeInput(body.patientName);
      if (body.address) body.address = sanitizeInput(body.address);
      if (body.pathologistNotes) body.pathologistNotes = sanitizeInput(body.pathologistNotes);

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { $set: body },
        { new: true }
      );

      if (!updatedBooking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      // ---------------------------------------------------------------------------
      // NOTIFICATIONS
      // ---------------------------------------------------------------------------

      // 1. Booking Confirmed (Accepted)
      if (updatedBooking.status === 'accepted' && oldBooking.status !== 'accepted') {
        const contactEmail = updatedBooking.bookedByEmail !== 'guest' ? updatedBooking.bookedByEmail : updatedBooking.email;
        const userForNotification = await User.findOne({ email: contactEmail });
        sendSmartNotification('BOOKING_CONFIRMED', {
          customerName: updatedBooking.patientName,
          customerEmail: contactEmail,
          customerPhone: updatedBooking.contactNumber,
          bookingId: updatedBooking._id.toString(),
          testNames: updatedBooking.tests.map((t: any) => t.title),
          totalAmount: updatedBooking.totalAmount,
          scheduledDate: updatedBooking.scheduledDate,
          collectionType: updatedBooking.collectionType,
          userTelegramChatId: userForNotification?.telegramChatId
        });
      }

      // 2. Partner Assigned (New or Reassigned - Notify NEW partner)
      // Check if partner changed OR status became assigned/reassigned
      if ((updatedBooking.status === 'assigned' || updatedBooking.status === 'reassigned') &&
        updatedBooking.assignedPartnerId &&
        (updatedBooking.assignedPartnerId !== oldBooking.assignedPartnerId || oldBooking.status === 'pending')) {

        const newPartner = await User.findById(updatedBooking.assignedPartnerId);
        if (newPartner && newPartner.telegramChatId) {
          sendSmartNotification('PARTNER_ASSIGNMENT', {
            customerName: updatedBooking.patientName,
            bookingId: updatedBooking._id.toString(),
            testNames: updatedBooking.tests.map((t: any) => t.title),
            scheduledDate: updatedBooking.scheduledDate,
            collectionType: updatedBooking.collectionType,
            partnerTelegramChatId: newPartner.telegramChatId
          });
        }
      }

      // 3. Report Ready
      if (updatedBooking.status === 'completed' && oldBooking.status !== 'completed') {
        const contactEmail = updatedBooking.bookedByEmail !== 'guest' ? updatedBooking.bookedByEmail : updatedBooking.email;
        const userForNotification = await User.findOne({ email: contactEmail });
        sendSmartNotification('REPORT_READY', {
          customerName: updatedBooking.patientName,
          customerEmail: contactEmail,
          customerPhone: updatedBooking.contactNumber,
          bookingId: updatedBooking._id.toString(),
          testNames: updatedBooking.tests.map((t: any) => t.title),
          reportLink: updatedBooking.reportFileUrl || '#',
          userTelegramChatId: userForNotification?.telegramChatId
        });
      }

      // 4. Cancelled
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
