import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Coupon from '@/models/Coupon';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/next-auth-options';

// GET /api/coupons/[id]/usage - Fetch usage history for a specific coupon
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'master')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // 1. Get Coupon Code from ID
        const coupon = await Coupon.findById(id);
        if (!coupon) {
            return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
        }

        // 2. Find Bookings using this code
        // Bookings store the code as string in 'couponCode'
        const query = { couponCode: coupon.code };

        const total = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .select('patientName totalAmount discountAmount createdAt tests status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        return NextResponse.json({
            matches: bookings,
            metadata: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching coupon usage:', error);
        return NextResponse.json({ error: 'Failed to fetch coupon usage' }, { status: 500 });
    }
}
