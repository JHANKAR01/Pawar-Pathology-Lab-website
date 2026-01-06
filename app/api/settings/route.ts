import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const settings = await Settings.getSingleton();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'master')) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const updates = await req.json();
    await dbConnect();
    let settings = await Settings.getSingleton();

    // 1. MASTER CASCADE LOGIC
    if (session.user.role === 'master' && updates.planFlags) {
      // If master disables WhatsApp in plan, forcefully disable the feature
      if (updates.planFlags.allowWhatsApp === false) {
        updates.whatsappEnabled = false;
      }
      // If master disables Sunday Bookings (sets allow to false), force Block Sundays to true
      if (updates.planFlags.allowSundayBookings === false) {
        updates.blockSundays = true;
      }
    }

    // 2. ADMIN PROTECTION LOGIC
    if (session.user.role === 'admin') {
      // Prevent Admin from enabling restricted features if Plan forbids it
      if (settings.planFlags?.allowWhatsApp === false && updates.whatsappEnabled === true) {
        return NextResponse.json({ message: "Plan Restriction: Upgrade to enable WhatsApp" }, { status: 403 });
      }

      // Note: blockSundays logic is inverse. 
      // If allowSundayBookings is FALSE, then blockSundays MUST be TRUE.
      // If Admin tries to set blockSundays = false (allow booking) when plan forbids it:
      if (settings.planFlags?.allowSundayBookings === false && updates.blockSundays === false) {
        return NextResponse.json({ message: "Plan Restriction: Sunday bookings not allowed" }, { status: 403 });
      }

      // Prevent Admin from modifying planFlags directly
      if (updates.planFlags) {
        delete updates.planFlags;
      }
    }

    Object.assign(settings, updates);
    await settings.save();

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
