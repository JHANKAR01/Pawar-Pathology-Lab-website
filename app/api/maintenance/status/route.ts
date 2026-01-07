import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();
        const settings = await Settings.getSingleton();

        return NextResponse.json({
            user: settings.maintenanceModeUser || false,
            partner: settings.maintenanceModePartner || false,
            messageUser: settings.maintenanceMessageUser || '',
            messagePartner: settings.maintenanceMessagePartner || '',
            broadcastEnabled: settings.broadcastEnabled || false,
            broadcastMessage: settings.broadcastMessage || ''
        });
    } catch (error) {
        console.error("Maintenance Status Check Failed:", error);
        // Fail open (allow access) if DB is down, to prevent total lockout
        return NextResponse.json({ user: false, partner: false }, { status: 500 });
    }
}
