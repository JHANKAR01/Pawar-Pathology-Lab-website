
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';
import { withRateLimit } from '@/lib/withRateLimit';
import { sendSmartNotification } from '@/lib/notifications';
import { createBookingWithTransaction } from '@/lib/services/bookingService';

// GET /api/bookings - Fetch bookings with pagination (Admin/Partner/Patient views)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = session.user.role?.toLowerCase();
  const authenticatedUserId = session.user.id;

  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    // Pagination Parameters (default: page 1, limit 10)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    let filter: Record<string, any> = {};

    // Admin, Partner, and Master can see all bookings or filter by userId/email
    if (role === 'master' || role === 'admin' || role === 'partner') {
      if (userId) {
        filter = { userId: userId };
      } else if (email) {
        filter = { bookedByEmail: email };
      }
    } else if (role === 'patient' || role === 'user') {
      // Patient/User can only see their own bookings
      if (userId && userId === authenticatedUserId) {
        filter = { userId: userId };
      } else if (email) {
        filter = { bookedByEmail: email };
      } else {
        filter = { userId: authenticatedUserId };
      }
    } else {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Execute paginated query with count
    const [bookings, totalCount] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      bookings,
      metadata: {
        totalCount,
        currentPage: page,
        totalPages,
        limit
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST /api/bookings - Create a new booking with atomic transaction
async function handler(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();

    // Delegate all business logic to the service layer
    const result = await createBookingWithTransaction(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const newBooking = result.booking;

    // Trigger Smart Notifications (Async - don't block response)
    sendSmartNotification('STAFF_NEW_BOOKING', {
      customerName: newBooking.patientName,
      customerEmail: newBooking.bookedByEmail !== 'guest' ? newBooking.bookedByEmail : newBooking.email,
      customerPhone: newBooking.contactNumber,
      bookingId: newBooking.id,
      testNames: newBooking.tests.map((t: any) => t.title),
      totalAmount: newBooking.totalAmount,
      scheduledDate: newBooking.scheduledDate,
      collectionType: newBooking.collectionType
    });

    return NextResponse.json({ message: 'Booking created successfully', bookingId: newBooking._id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 400 });
  }
}

export const POST = withRateLimit(handler);
