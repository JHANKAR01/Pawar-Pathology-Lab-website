import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { addDays, addMonths, addWeeks, startOfDay } from 'date-fns';

export async function GET(request: Request) {
    // Security: Verify Cron Secret if needed (skipping for now based on context, similar to other crons)

    await dbConnect();

    try {
        const today = startOfDay(new Date());

        // Find bookings with recurrence active
        // We only look at the "latest" bookings to avoid duplicates from history
        // For simplicity V1: Fetch all recurring bookings sorted by date desc, 
        // and distinct by chain? Or just process all and check existence.
        // Better: Process bookings where recurrence != 'none' AND scheduledDate is in the past (completed) 
        // OR just scheduledDate + interval is approaching.

        // Let's iterate all "Active" recurrence templates. 
        // In a real system, we'd have a separate "RecurrenceSchedule" model.
        // Here, we maintain it on the Booking itself. 
        // Strategy: Find bookings with recurrence != 'none' that do NOT have a child booking yet for the next interval.

        const recurringBookings = await Booking.find({
            recurrence: { $ne: 'none' },
            status: { $nin: ['cancelled', 'rejected'] } // Only active/completed chains
        });

        let createdCount = 0;
        const errors: string[] = [];

        for (const booking of recurringBookings) {
            const lastDate = new Date(booking.scheduledDate);
            let nextDate: Date | null = null;

            switch (booking.recurrence) {
                case 'daily': nextDate = addDays(lastDate, 1); break;
                case 'weekly': nextDate = addWeeks(lastDate, 1); break;
                case 'biweekly': nextDate = addWeeks(lastDate, 2); break;
                case 'monthly': nextDate = addMonths(lastDate, 1); break;
            }

            if (nextDate && nextDate > today) {
                // Only generate if next date is within reasonable future (e.g. next 7 days)?
                // Or if it's strictly the NEXT one.
                // Let's create it if it's "Time to book".

                // CHECK DUPLICATE: Does a booking exist for this patient on this date?
                const exists = await Booking.findOne({
                    patientName: booking.patientName,
                    scheduledDate: nextDate,
                    status: { $ne: 'cancelled' }
                });

                if (!exists) {
                    // Check if we already generated a child for this specific parent?
                    // "parentBookingId": booking._id
                    const alreadyGenerated = await Booking.findOne({ parentBookingId: booking._id.toString() });

                    // If already generated, then `booking` is not the latest tip of the chain. 
                    // We should only process the TRULY latest one or handle chain logic.
                    // Simplified: Only process if NO child exists.
                    if (!alreadyGenerated) {
                        // Auto-create next booking
                        try {
                            await Booking.create({
                                patientName: booking.patientName,
                                contactNumber: booking.contactNumber,
                                email: booking.email,
                                bookedByEmail: booking.bookedByEmail,
                                userId: booking.userId,
                                tests: booking.tests,
                                totalAmount: booking.totalAmount, // pricing might change, but V1 copy
                                amountTaken: 0,
                                balanceAmount: booking.totalAmount,
                                collectionType: booking.collectionType,
                                address: booking.address,
                                coordinates: booking.coordinates,
                                scheduledDate: nextDate,
                                status: 'pending', // Needs confirmation? Or 'accepted'?
                                paymentMode: booking.paymentMode,
                                paymentStatus: 'unpaid',
                                recurrence: booking.recurrence, // Propagate recurrence!
                                parentBookingId: booking._id.toString(), // Link to previous
                                referredBy: booking.referredBy
                            });

                            // Mark parent's recurrence as 'none' or keep it? 
                            // If we keep it 'monthly', next job will process the NEW booking.
                            // But we must stop processing the OLD booking.
                            // OPTION A: Set old booking recurrence to 'none' so it's "handoff".
                            // OPTION B: Keep it and use `alreadyGenerated` check (implemented above).

                            // Let's go with Option B (Chain Link) + Disable Recurrence on Old?
                            // Actually, modifying old booking is safer to avoid multiple scans.
                            booking.recurrence = 'none';
                            await booking.save();

                            createdCount++;
                        } catch (e: any) {
                            errors.push(`Failed for ${booking._id}: ${e.message}`);
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            created: createdCount,
            message: `Generated ${createdCount} recurring bookings`,
            errors
        });

    } catch (error: any) {
        console.error("Cron Recurrence Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
