
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking, { IBooking } from '@/models/Booking';
import { verifyToken } from '@/lib/auth';

// GET /api/bookings - Fetch all bookings (Admin/Partner view) or user's own bookings (Patient/User)
export async function GET(request: Request) {
  const authResult = await verifyToken(request);
  if (authResult.response) {
    return authResult.response;
  }

  const role = authResult.decoded?.role;
  const authenticatedUserId = authResult.decoded?.userId;

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
export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    
    // Calculate balance amount
    const totalAmount = body.totalAmount || 0;
    const amountTaken = body.amountTaken || 0;
    body.balanceAmount = totalAmount - amountTaken;

    const booking = await Booking.create(body);
    
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 400 });
  }
}
