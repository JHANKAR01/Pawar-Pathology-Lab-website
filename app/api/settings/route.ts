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

    // 1. MASTER CASCADE LOGIC - Disable feature when permission is revoked
    if (session.user.role === 'master' && updates.planFlags) {
      const pf = updates.planFlags;
      // Verification
      if (pf.allowVerification === false) updates.requireVerification = false;
      // SMS/Email
      if (pf.allowSmsEmail === false) { updates.smsEnabled = false; updates.emailEnabled = false; }
      // Sunday Bookings (inverse: disallowing = force block)
      if (pf.allowSundayBookings === false) updates.blockSundays = true;
      // Maintenance Config
      if (pf.allowMaintenanceConfig === false) { updates.maintenanceModeUser = false; updates.maintenanceModePartner = false; }
      // WhatsApp
      if (pf.allowWhatsApp === false) { updates.whatsappEnabled = false; updates.whatsappOfficialEnabled = false; }
      // Telegram
      if (pf.allowTelegram === false) { updates.telegramEnabled = false; updates.telegramEnabledAdmin = false; updates.telegramEnabledPartner = false; updates.telegramEnabledUser = false; }
      // Geofencing
      if (pf.allowGeofencing === false) updates.locationFencingEnabled = false;
    }

    // 2. ADMIN PROTECTION LOGIC - Prevent enabling features if Plan forbids
    if (session.user.role === 'admin') {
      const pf = settings.planFlags;
      if (pf?.allowVerification === false && updates.requireVerification === true) return NextResponse.json({ message: "Plan Restriction: Verification not allowed" }, { status: 403 });
      if (pf?.allowSmsEmail === false && (updates.smsEnabled === true || updates.emailEnabled === true)) return NextResponse.json({ message: "Plan Restriction: SMS/Email not allowed" }, { status: 403 });
      if (pf?.allowSundayBookings === false && updates.blockSundays === false) return NextResponse.json({ message: "Plan Restriction: Sunday bookings not allowed" }, { status: 403 });
      if (pf?.allowMaintenanceConfig === false && (updates.maintenanceModeUser === true || updates.maintenanceModePartner === true)) return NextResponse.json({ message: "Plan Restriction: Maintenance config not allowed" }, { status: 403 });
      if (pf?.allowWhatsApp === false && updates.whatsappEnabled === true) return NextResponse.json({ message: "Plan Restriction: WhatsApp not allowed" }, { status: 403 });
      if (pf?.allowTelegram === false && updates.telegramEnabled === true) return NextResponse.json({ message: "Plan Restriction: Telegram not allowed" }, { status: 403 });
      if (pf?.allowGeofencing === false && updates.locationFencingEnabled === true) return NextResponse.json({ message: "Plan Restriction: Geofencing not allowed" }, { status: 403 });
      // Prevent Admin from modifying planFlags directly
      if (updates.planFlags) delete updates.planFlags;
    }

    Object.assign(settings, updates);
    await settings.save();

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
