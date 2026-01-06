
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';

export async function GET() {
  await dbConnect();
  const settings = await Settings.getSingleton();
  return NextResponse.json(settings);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toLowerCase();

  if (!session || (role !== 'admin' && role !== 'master')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const body = await request.json();
  console.log("Received Settings Update:", body); // Debugging

  // Retrieve current settings to check plan flags
  const currentSettings = await Settings.getSingleton();

  // If user is NOT a master, enforce plan checks
  if (role !== 'master') {
    const planFlags = currentSettings.planFlags || { allowWhatsApp: false, allowSundayBookings: false };

    // Check WhatsApp Gating
    // If trying to enable WhatsApp (whatsappEnabled=true) but plan says allowWhatsApp=false
    if (body.whatsappEnabled === true && !planFlags.allowWhatsApp) {
      return NextResponse.json(
        { error: 'Forbidden. Your plan does not support WhatsApp integration.' },
        { status: 403 }
      );
    }

    // Check Sunday Gating
    // If trying to UNBLOCK sundays (blockSundays=false) but plan says allowSundayBookings=false
    // NOTE: "allowSundayBookings" means you CAN take bookings. "blockSundays" means you CANNOT.
    // So if allowSundayBookings is FALSE, then blockSundays MUST be TRUE.
    // If user tries to set blockSundays = false, it's a violation.
    if (body.blockSundays === false && !planFlags.allowSundayBookings) {
      return NextResponse.json(
        { error: 'Forbidden. Your plan does not support Sunday bookings.' },
        { status: 403 }
      );
    }

    // Prevent Admin from modifying planFlags themselves
    if (body.planFlags) {
      delete body.planFlags;
    }
  }

  // Update the singleton document
  const settings = await Settings.findOneAndUpdate({}, body, {
    new: true,
    upsert: true, // Create if doesn't exist
    setDefaultsOnInsert: true
  });

  return NextResponse.json(settings);
}
