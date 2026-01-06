
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statusTab = searchParams.get('statusTab'); // active, completed, specimens
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    let filter: any = {};

    if (role === 'admin' || role === 'partner') {
      if (userId) {
        filter = { userId: userId };
      } else if (email) {
        filter = { bookedByEmail: email };
      }
    }
    // Patient/User can only see their own bookings
    else if (role === 'patient' || role === 'user') {
      if (userId && userId === authenticatedUserId) {
        filter = { userId: userId };
      } else if (email) {
        // Allow patients to fetch by their own email
        filter = { bookedByEmail: email };
      } else {
        // If no userId or email provided, return user's own bookings
        filter = { userId: authenticatedUserId };
      }
    } else {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // --- Search Logic (Case Insensitive Regex) ---
    if (search) {
      filter.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { _id: search } // Exact ID match usually
      ];
    }

    // --- Status Tab Logic ---
    if (statusTab) {
      switch (statusTab) {
        case 'active':
          filter.status = { $nin: ['completed', 'cancelled', 'rejected', 'report_uploaded'] };
          break;
        case 'completed':
          filter.status = { $in: ['completed', 'report_uploaded'] };
          break;
        case 'specimens':
          filter.status = { $in: ['accepted', 'assigned', 'sample_collected', 'reached'] };
          break;
        case 'all':
          // No status filter
          break;
      }
    }

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      bookings,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

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
import Settings from '@/models/Settings';
import { getDisplacement, getRoadDistance } from '@/lib/geospatial';
import { sanitizeInput } from '@/lib/sanitize';

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
    let usedCoupon: any = null;

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

    if (Math.abs(serverTotal - body.totalAmount) > 1) {
      console.error(`Price Mismatch! Server: ${serverTotal}, Client: ${body.totalAmount}`);
      return NextResponse.json({ error: 'Price integrity check failed.' }, { status: 400 });
    }

    // --- Geofencing & Logistics Logic ---
    let distanceFromLab = 0;
    const settings = await Settings.getSingleton();

    if (body.collectionType === 'home' && body.coordinates) {
      // Server-side distance calculation for trust
      if (settings.distanceType === 'road') {
        distanceFromLab = await getRoadDistance(body.coordinates.lat, body.coordinates.lng);
      } else {
        distanceFromLab = getDisplacement(body.coordinates.lat, body.coordinates.lng);
      }

      // Enforce Geofencing
      if (settings.locationFencingEnabled && distanceFromLab > settings.serviceRadius) {
        return NextResponse.json({
          error: `Location is ${distanceFromLab.toFixed(1)}km away. We only serve within ${settings.serviceRadius}km via ${settings.distanceType === 'road' ? 'road' : 'direct line'}.`
        }, { status: 400 });
      }
    }

    // Sanitize User Inputs (XSS Protection)
    const sanitizedPatientName = sanitizeInput(body.patientName || '');
    const sanitizedAddress = sanitizeInput(body.address || '');

    // 4. Create Booking
    const finalBookingData = {
      ...body,
      patientName: sanitizedPatientName,
      address: sanitizedAddress,
      scheduledDate: body.scheduledDate || body.date,
      totalAmount: serverTotal,
      discountAmount,
      couponCode: couponCode ? couponCode.toUpperCase().trim() : undefined,
      balanceAmount: (serverTotal - (body.amountTaken || 0)),
      distanceFromLab // Save calculated distance
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
