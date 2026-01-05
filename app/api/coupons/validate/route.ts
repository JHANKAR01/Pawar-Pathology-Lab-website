import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Coupon from '@/models/Coupon';

import { withRateLimit } from '@/lib/withRateLimit';

async function handler(request: Request) {
  await dbConnect();

  try {
    const body = await request.json();
    const { code, totalAmount } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid coupon code', valid: false },
        { status: 400 }
      );
    }

    if (!totalAmount || typeof totalAmount !== 'number' || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid total amount', valid: false },
        { status: 400 }
      );
    }

    // Find coupon by code (case-insensitive)
    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true
    });

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or inactive coupon code',
        errorCode: 'INVALID'
      });
    }

    // Check if coupon has expired
    if (new Date() > coupon.expiryDate) {
      return NextResponse.json({
        valid: false,
        error: 'This coupon has expired',
        errorCode: 'EXPIRED'
      });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({
        valid: false,
        error: 'This coupon has reached its usage limit',
        errorCode: 'LIMIT_REACHED'
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      // Ensure percentage is between 0 and 100
      const percentage = Math.min(100, Math.max(0, coupon.value));
      discount = (totalAmount * percentage) / 100;
    } else {
      // Fixed amount discount
      discount = Math.min(coupon.value, totalAmount); // Can't discount more than total
    }

    // Return validation result (don't reveal discount logic, just the result)
    return NextResponse.json({
      valid: true,
      discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
      couponCode: coupon.code
    });

  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate coupon', valid: false },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handler);

