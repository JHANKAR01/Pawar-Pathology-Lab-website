
import { NextResponse } from 'next/server';
import { provisionNextBatch } from '@/lib/googleDrive';
import Settings from '@/models/Settings';
import dbConnect from '@/lib/dbConnect';
import { sendSmartNotification } from '@/lib/notifications';

// This route relies on an external Vercel Cron or similar scheduler hitting it daily.
// We secure it via a CRON_SECRET header if available, or assume it's publicly callable but idempotent.
// For now, we'll keep it open or check for a simple header.

export async function GET(request: Request) {
    try {
        await dbConnect();

        // Simple security check (Optional: verify CRON_SECRET from Headers)
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) ...

        const now = new Date();
        const day = now.getDate();
        const settings = await Settings.getSingleton();

        // 1. Alert on 25th If Not Provisioned (simulated logic)
        // In real "10-day batch" mode, we just check if we are running low on folders.
        // But per requirements: "25th of the Month: If folders for the next month are not provisioned..."

        if (day === 25) {
            // Check if next month exists in DriveFolder?
            // With new batch logic, we just check lastProvisionedDate.
            const lastDate = settings.lastProvisionedDate ? new Date(settings.lastProvisionedDate) : new Date();

            // If last provisioned date is less than 5 days away from end of month?
            // Requirement logic: "If folders for the next month are not provisioned"
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            if (lastDate < nextMonth) {
                // Alert Admin!
                console.log("Alert: Drive folders running low.");
                await sendSmartNotification('ADMIN_ALERT', {
                    customerName: 'Drive Provisioning',
                    bookingId: 'SYSTEM', // Dummy ID
                    reportLink: ''
                });
            }
        }

        // 2. Auto Provision on 26th
        if (day === 26 && settings.autoProvisionEnabled) {
            console.log("Auto-provisioning Triggered");
            const result = await provisionNextBatch(10);
            return NextResponse.json({ action: 'provisioned', result });
        }

        return NextResponse.json({ status: 'checked', date: now.toISOString() });

    } catch (error: any) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
