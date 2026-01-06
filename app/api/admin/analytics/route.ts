import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import { authOptions } from '@/lib/next-auth-options';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const allowedRoles = ['admin', 'master'];
        if (!session.user.role || !allowedRoles.includes(session.user.role)) {
            return NextResponse.json(
                { message: "Forbidden. Admin access required." },
                { status: 403 }
            );
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        let matchStage: any = {};

        if (startDateStr && endDateStr) {
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            // Set end date to end of day
            endDate.setHours(23, 59, 59, 999);

            matchStage.createdAt = {
                $gte: startDate,
                $lte: endDate
            };
        } else {
            // Default to last 30 days if no range provided
            const today = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(today.getDate() - 30);
            matchStage.createdAt = { $gte: thirtyDaysAgo };
        }

        // Exclude cancelled/rejected if needed, but usually analytics includes all or filters by status.
        // Let's exclude strictly "cancelled" bookings from revenue for now, unless "total bookings" count.
        // For simplicity, we'll keep all but maybe exclude test/internal ones if any.
        // Assuming we want "Completed" or "Pending" revenue? Usually "Total Revenue" implies all non-cancelled.
        // Let's filter out 'cancelled' status if it exists. Based on existing code, status values are varied.
        // We will sum everything that is NOT 'cancelled'.

        matchStage.status = { $ne: 'cancelled' };

        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Kolkata" } }, // Group by date
                    dailyRevenue: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } } // Sort by date ascending
        ];

        const aggregationResult = await Booking.aggregate(pipeline);

        // Calculate Totals
        const totalRevenue = aggregationResult.reduce((acc, curr) => acc + curr.dailyRevenue, 0);
        const bookingCount = aggregationResult.reduce((acc, curr) => acc + curr.count, 0);

        // Fill in missing dates for the chart
        // Implementation detail: If we want a perfect chart, we should fill gaps with 0.
        // The frontend can also handle gaps, but safer to do it here or just return raw data.
        // For simplicity, let's return raw data and correct gaps on frontend or here.
        // Let's try to fill gaps here for "Daily Trends".

        const dailyTrends = aggregationResult.map(item => ({
            date: item._id,
            revenue: item.dailyRevenue,
            count: item.count
        }));

        return NextResponse.json({
            totalRevenue,
            bookingCount,
            dailyTrends
        });

    } catch (error: any) {
        console.error("Analytics Error:", error);
        return NextResponse.json(
            { message: "Internal Server Error", error: error.message },
            { status: 500 }
        );
    }
}
