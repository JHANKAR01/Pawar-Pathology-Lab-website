import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Coupon from '@/models/Coupon';
import { verifyAdmin } from '@/lib/auth';

import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET /api/coupons - Fetch all coupons (Admin only)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toLowerCase();

  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return NextResponse.json(coupons);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST /api/coupons - Create a new coupon (Admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role?.toLowerCase();

  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  try {
    const body = await request.json();
    const { code, discountType, value, expiryDate, usageLimit } = body;

    if (!code || !discountType || value === undefined || !expiryDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate discount value
    if (discountType === 'percentage' && (value < 0 || value > 100)) {
      return NextResponse.json(
        { error: 'Percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (discountType === 'fixed' && value < 0) {
      return NextResponse.json(
        { error: 'Fixed amount must be positive' },
        { status: 400 }
      );
    }

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      value,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
      isActive: true,
      usedCount: 0
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    console.error('Coupon creation error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

