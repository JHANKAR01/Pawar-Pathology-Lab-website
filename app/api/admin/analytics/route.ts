
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';
import { startOfDay, endOfDay, subDays, eachDayOfInterval, format } from 'date-fns';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== 'admin' && session.user.role !== 'master')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        // Default to last 30 days if no date provided
        const end = endDateParam ? endOfDay(new Date(endDateParam)) : endOfDay(new Date());
        const start = startDateParam ? startOfDay(new Date(startDateParam)) : startOfDay(subDays(new Date(), 30));

        // 1. Summary Metrics (Total for the period)
        const dateFilter = { createdAt: { $gte: start, $lte: end } };

        const [
            totalRevenueResult,
            pendingCount,
            completedCount,
            totalPatients
        ] = await Promise.all([
            Booking.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$totalAmount" }
                    }
                }
            ]),
            Booking.countDocuments({ ...dateFilter, status: 'pending' }),
            Booking.countDocuments({ ...dateFilter, status: 'completed' }),
            User.countDocuments({ ...dateFilter, role: 'patient' }) // New patients in period
        ]);

        const totalRevenue = totalRevenueResult[0]?.total || 0;

        // 2. Trend Data (Daily)
        const dailyStats = await Booking.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days with 0
        const allDays = eachDayOfInterval({ start, end });
        const trends = allDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const stat = dailyStats.find(s => s._id === dateStr);
            return {
                date: dateStr,
                revenue: stat?.revenue || 0,
                count: stat?.count || 0
            };
        });

        return NextResponse.json({
            summary: {
                totalRevenue,
                pendingCount,
                completedCount,
                totalPatients
            },
            trends
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
