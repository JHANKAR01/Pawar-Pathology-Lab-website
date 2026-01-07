import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import RecurringBooking from '@/models/RecurringBooking';
import Settings from '@/models/Settings';
import Test from '@/models/Test';
import { sendSmartNotification } from '@/lib/notifications';

// GET /api/cron/recurring-bookings
// This should be called daily by a cron scheduler (e.g. Vercel Cron or external)
export async function GET(request: Request) {
    try {
        await dbConnect();

        // Check if feature is enabled globally
        const settings = await Settings.findOne().lean();
        if (!settings?.planFlags?.allowRecurringTests) {
            return NextResponse.json({ message: 'Recurring tests feature disabled in settings' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find due recurring bookings
        // Status active, nextRunDate <= today, (endDate undefined or endDate >= today)
        const dueRecurring = await RecurringBooking.find({
            status: 'active',
            nextRunDate: { $lte: new Date() }, // Check if due or overdue
            $or: [
                { endDate: { $exists: false } },
                { endDate: { $gte: today } }
            ]
        });

        console.log(`[Cron] Found ${dueRecurring.length} recurring bookings due.`);

        const results = {
            processed: 0,
            created: 0,
            errors: 0,
            details: [] as string[]
        };

        for (const recurring of dueRecurring) {
            results.processed++;
            try {
                // 1. Create the new Booking
                // Fetch fresh test details to get current prices
                const tests = await Test.find({ _id: { $in: recurring.testIds } });

                let totalAmount = 0;
                const bookingTests = tests.map(t => {
                    totalAmount += t.price;
                    return {
                        id: t._id.toString(),
                        title: t.title,
                        price: t.price,
                        category: t.category
                    };
                });

                // Create Booking
                const newBooking = await Booking.create({
                    userId: recurring.userId,
                    patientName: recurring.patientName,
                    tests: bookingTests,
                    totalAmount,
                    balanceAmount: totalAmount, // Assuming unpaid initially
                    collectionType: recurring.collectionType,
                    address: recurring.address,
                    coordinates: recurring.coordinates,
                    scheduledDate: new Date(), // Scheduled for TODAY
                    status: 'pending', // Pending approval/assignment
                    paymentStatus: 'unpaid',
                    bookedByEmail: 'system-recurring', // Indicate system created
                    email: recurring.parentBookingId ? undefined : 'system-recurring', // Fallback
                    // We could link back to original user email if we fetched it, but userId is safer link
                });

                // 2. Calculate Next Run Date
                const lastRun = new Date();
                const nextRun = new Date(lastRun);

                if (recurring.frequency === 'weekly') {
                    nextRun.setDate(nextRun.getDate() + 7);
                } else if (recurring.frequency === 'monthly') {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }

                // 3. Update Recurring Record
                recurring.lastRunDate = lastRun;
                recurring.nextRunDate = nextRun;

                // Auto-complete if end date reached? 
                // Logic handled by query next time, but we can set status if nextRun > endDate
                if (recurring.endDate && nextRun > recurring.endDate) {
                    recurring.status = 'completed';
                }

                await recurring.save();
                results.created++;
                results.details.push(`Created booking ${newBooking._id} for recurring ${recurring._id}`);

                // 4. Notify User (Optional but good)
                // Need to fetch user to get email/chatId. Skipped for now to keep cron lightweight.
                // But we should notify admin via 'STAFF_NEW_BOOKING' ideally.
                // sendSmartNotification('STAFF_NEW_BOOKING', ...);

            } catch (err: any) {
                console.error(`[Cron] Error processing recurring ${recurring._id}:`, err);
                results.errors++;
                results.details.push(`Error for ${recurring._id}: ${err.message}`);
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('[Cron] Critical Failure:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
