/**
 * Coupon Service - Business Logic for Coupon Validation
 * Extracted from booking route for Clean Architecture
 */

import Coupon, { ICoupon } from '@/models/Coupon';
import { ClientSession } from 'mongoose';

export interface CouponValidationResult {
    isValid: boolean;
    coupon: ICoupon | null;
    discountAmount: number;
    error?: string;
}

/**
 * Validates a coupon code and calculates the discount amount.
 * Does NOT increment usage - that happens in the transaction.
 */
export async function validateCoupon(
    code: string,
    subtotal: number
): Promise<CouponValidationResult> {
    if (!code || !code.trim()) {
        return { isValid: true, coupon: null, discountAmount: 0 };
    }

    const normalizedCode = code.toUpperCase().trim();
    const coupon = await Coupon.findOne({ code: normalizedCode });

    // Coupon not found
    if (!coupon) {
        return {
            isValid: false,
            coupon: null,
            discountAmount: 0,
            error: 'Invalid coupon code'
        };
    }

    // Check if active
    if (!coupon.isActive) {
        return {
            isValid: false,
            coupon: null,
            discountAmount: 0,
            error: 'Coupon is inactive'
        };
    }

    // Check expiry
    if (new Date(coupon.expiryDate) < new Date()) {
        return {
            isValid: false,
            coupon: null,
            discountAmount: 0,
            error: 'Coupon has expired'
        };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return {
            isValid: false,
            coupon: null,
            discountAmount: 0,
            error: 'Coupon usage limit reached'
        };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
        discountAmount = (subtotal * coupon.value) / 100;
    } else {
        discountAmount = coupon.value;
    }

    return {
        isValid: true,
        coupon,
        discountAmount
    };
}

/**
 * Increments coupon usage count within a transaction.
 * @param couponId - MongoDB ObjectId of the coupon
 * @param session - Mongoose ClientSession for transaction support
 */
export async function incrementCouponUsage(
    couponId: string,
    session?: ClientSession
): Promise<void> {
    const updateOptions = session ? { session } : {};
    await Coupon.findByIdAndUpdate(
        couponId,
        { $inc: { usedCount: 1 } },
        updateOptions
    );
}
