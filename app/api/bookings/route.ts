
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking, { IBooking } from '@/models/Booking';

// GET /api/bookings - Fetch all bookings (Admin/Partner view)
export async function GET(request: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    const filter = email ? { bookedByEmail: email } : {};

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST /api/bookings - Create a new booking (Patient Wizard)
export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    
    // Basic validation could go here
    const booking = await Booking.create(body);
    
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 400 });
  }
}
