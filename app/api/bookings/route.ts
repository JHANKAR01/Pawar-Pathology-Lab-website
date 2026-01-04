
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';

// GET /api/bookings - Fetch all bookings (Admin/Partner view) or user's own bookings (Patient/User)
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

    // Admin and Partner can see all bookings or filter by userId/email
    if (role === 'admin' || role === 'partner') {
      let filter = {};
      if (userId) {
        filter = { userId: userId };
      } else if (email) {
        filter = { bookedByEmail: email };
      }

      const bookings = await Booking.find(filter).sort({ createdAt: -1 });
      return NextResponse.json(bookings);
    }

    // Patient/User can only see their own bookings
    if (role === 'patient' || role === 'user') {
      if (userId && userId === authenticatedUserId) {
        const bookings = await Booking.find({ userId: userId }).sort({ createdAt: -1 });
        return NextResponse.json(bookings);
      } else if (email) {
        // Allow patients to fetch by their own email
        const bookings = await Booking.find({ bookedByEmail: email }).sort({ createdAt: -1 });
        return NextResponse.json(bookings);
      } else {
        // If no userId or email provided, return user's own bookings
        const bookings = await Booking.find({ userId: authenticatedUserId }).sort({ createdAt: -1 });
        return NextResponse.json(bookings);
      }
    }

    return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST /api/bookings - Create a new booking (Patient Wizard)
import Coupon from '@/models/Coupon';
import Test from '@/models/Test';
import { sendSmartNotification } from '@/lib/notifications';

// POST /api/bookings - Create a new booking (Patient Wizard)
import { withRateLimit } from '@/lib/withRateLimit';

// POST /api/bookings - Create a new booking (Patient Wizard)
async function handler(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { tests, couponCode } = body;

    // 1. Calculate Subtotal from Database
    let serverSubtotal = 0;
    // tests coming from frontend: [{ id, title, price, category }]
    // We only trust the IDs
    const testIds = tests.map((t: any) => t.id);
    const dbTests = await Test.find({ _id: { $in: testIds } });

    if (dbTests.length !== testIds.length) {
      return NextResponse.json({ error: 'Invalid test IDs provided' }, { status: 400 });
    }

    // Sum up the real prices
    for (const dbTest of dbTests) {
      serverSubtotal += dbTest.price;
    }

    // 2. Validate Coupon & Calculate Discount
    let discountAmount = 0;
    let usedCoupon = null;

    if (couponCode) {
      usedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });

      if (!usedCoupon) {
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
      }

      if (!usedCoupon.isActive) {
        return NextResponse.json({ error: 'Coupon is inactive' }, { status: 400 });
      }

      if (new Date(usedCoupon.expiryDate) < new Date()) {
        return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
      }

      if (usedCoupon.usageLimit && usedCoupon.usedCount >= usedCoupon.usageLimit) {
        return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
      }

      if (usedCoupon.discountType === 'percentage') {
        discountAmount = (serverSubtotal * usedCoupon.value) / 100;
      } else {
        discountAmount = usedCoupon.value;
      }
    }

    // 3. Final Verification
    const serverTotal = Math.max(0, serverSubtotal - discountAmount);

    // Allow a small epsilon for floating point issues? Usually exact match is best for currency.
    // Frontend sends 'totalAmount'.
    if (Math.abs(serverTotal - body.totalAmount) > 1) { // 1 rupee tolerance
      console.error(`Price Mismatch! Server: ${serverTotal}, Client: ${body.totalAmount}`);
      return NextResponse.json({ error: 'Price integrity check failed.' }, { status: 400 });
    }

    // 4. Create Booking
    const finalBookingData = {
      ...body,
      scheduledDate: body.scheduledDate || body.date, // Handle both 'scheduledDate' (from page.tsx) and 'date'
      totalAmount: serverTotal,
      discountAmount,
      couponCode: couponCode ? couponCode.toUpperCase().trim() : undefined,
      balanceAmount: (serverTotal - (body.amountTaken || 0)),
      // Ensure paymentStatus is correct based on paymentMode/amounts (frontend handles logic but let's trust it for now unless critical)
    };

    const newBooking = await Booking.create(finalBookingData);

    // 5. Update Coupon Usage if applicable
    if (usedCoupon) {
      await Coupon.findByIdAndUpdate(usedCoupon._id, { $inc: { usedCount: 1 } });
    }

    // 6. Trigger Smart Notifications (Async - don't block response)
    // 6. Trigger Smart Notifications (Async - don't block response)
    sendSmartNotification('STAFF_NEW_BOOKING', {
      customerName: newBooking.patientName,
      customerEmail: newBooking.bookedByEmail !== 'guest' ? newBooking.bookedByEmail : newBooking.email,
      customerPhone: newBooking.contactNumber,
      bookingId: newBooking.id, // Use friendly ID
      testNames: newBooking.tests.map((t: any) => t.title),
      totalAmount: newBooking.totalAmount,
      scheduledDate: newBooking.scheduledDate,
      collectionType: newBooking.collectionType
    });

    return NextResponse.json({ message: 'Booking created successfully', bookingId: newBooking._id }, { status: 201 });
  } catch (error) {
    console.error("Booking Creation Error:", error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 400 });
  }
}

export const POST = withRateLimit(handler);
