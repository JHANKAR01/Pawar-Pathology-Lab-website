/**
 * Booking Service - Business Logic for Booking Operations
 * Extracted from booking route for Clean Architecture
 */

import mongoose, { ClientSession } from 'mongoose';
import dbConnect from '@/lib/dbConnect';
import Booking from '@/models/Booking';
import Test from '@/models/Test';
import Settings from '@/models/Settings';
import { getDisplacement, getRoadDistance } from '@/lib/geospatial';
import { sanitizeInput } from '@/lib/sanitize';
import { validateCoupon, incrementCouponUsage } from './couponService';
import CouponUsage from '@/models/CouponUsage';

export interface BookingInput {
    tests: Array<{ id: string; title?: string; price?: number; category?: string }>;
    couponCode?: string;
    patientName: string;
    address?: string;
    scheduledDate?: string | Date;
    date?: string | Date;
    collectionType: 'home' | 'lab_visit';
    coordinates?: { lat: number; lng: number };
    totalAmount: number;
    amountTaken?: number;
    [key: string]: any; // Allow additional fields
}

export interface SubtotalResult {
    subtotal: number;
    tests: Array<{ _id: string; title: string; price: number; category: string }>;
    error?: string;
}

/**
 * Calculates the subtotal by fetching test prices from the database.
 * This ensures we never trust client-side pricing.
 */
export async function calculateSubtotal(testIds: string[]): Promise<SubtotalResult> {
    const dbTests = await Test.find({ _id: { $in: testIds } });

    if (dbTests.length !== testIds.length) {
        return {
            subtotal: 0,
            tests: [],
            error: 'Invalid test IDs provided'
        };
    }

    let subtotal = 0;
    const tests = dbTests.map((test: any) => {
        subtotal += test.price;
        return {
            _id: test._id.toString(),
            title: test.title,
            price: test.price,
            category: test.category
        };
    });

    return { subtotal, tests };
}

export interface GeofencingResult {
    isAllowed: boolean;
    distance: number;
    error?: string;
}

/**
 * Validates geofencing rules for home collection bookings.
 */
export async function validateGeofencing(
    coordinates: { lat: number; lng: number } | undefined,
    collectionType: string,
    settings: any
): Promise<GeofencingResult> {
    if (collectionType !== 'home' || !coordinates) {
        return { isAllowed: true, distance: 0 };
    }

    let distanceFromLab = 0;

    if (settings.distanceType === 'road') {
        distanceFromLab = await getRoadDistance(coordinates.lat, coordinates.lng);
    } else {
        distanceFromLab = getDisplacement(coordinates.lat, coordinates.lng);
    }

    if (settings.locationFencingEnabled && distanceFromLab > settings.serviceRadius) {
        return {
            isAllowed: false,
            distance: distanceFromLab,
            error: `Location is ${distanceFromLab.toFixed(1)}km away. We only serve within ${settings.serviceRadius}km via ${settings.distanceType === 'road' ? 'road' : 'direct line'}.`
        };
    }

    return { isAllowed: true, distance: distanceFromLab };
}

export interface BookingCreationResult {
    success: boolean;
    booking?: any;
    bookingId?: string;
    error?: string;
}

/**
 * Creates a booking with full transaction support.
 * All operations (booking creation + coupon update) are atomic.
 */
export async function createBookingWithTransaction(
    input: BookingInput
): Promise<BookingCreationResult> {
    await dbConnect();

    const { tests, couponCode, patientName, address } = input;
    const testIds = tests.map((t) => t.id);

    // 1. Calculate Subtotal from Database
    const subtotalResult = await calculateSubtotal(testIds);
    if (subtotalResult.error) {
        return { success: false, error: subtotalResult.error };
    }

    // 2. Validate Coupon & Calculate Discount
    const couponResult = await validateCoupon(couponCode || '', subtotalResult.subtotal);
    if (!couponResult.isValid) {
        return { success: false, error: couponResult.error };
    }

    // 3. Final Price Calculation
    const serverTotal = Math.max(0, subtotalResult.subtotal - couponResult.discountAmount);

    // 4. Price Integrity Check
    if (Math.abs(serverTotal - input.totalAmount) > 1) {
        return { success: false, error: 'Price integrity check failed.' };
    }

    // 5. Geofencing Validation
    const settings = await Settings.getSingleton();
    const geofencingResult = await validateGeofencing(
        input.coordinates,
        input.collectionType,
        settings
    );

    if (!geofencingResult.isAllowed) {
        return { success: false, error: geofencingResult.error };
    }

    // 6. Sanitize User Inputs
    const sanitizedPatientName = sanitizeInput(patientName || '');
    const sanitizedAddress = sanitizeInput(address || '');

    // 7. Prepare Final Booking Data
    const finalBookingData = {
        ...input,
        patientName: sanitizedPatientName,
        address: sanitizedAddress,
        scheduledDate: input.scheduledDate || input.date,
        totalAmount: serverTotal,
        discountAmount: couponResult.discountAmount,
        couponCode: couponCode ? couponCode.toUpperCase().trim() : undefined,
        balanceAmount: serverTotal - (input.amountTaken || 0),
        distanceFromLab: geofencingResult.distance
    };

    // 8. Execute Atomic Transaction
    const session = await mongoose.startSession();

    try {
        let newBooking: any;

        await session.withTransaction(async () => {
            // Create booking within transaction
            const bookings = await Booking.create([finalBookingData], { session });
            newBooking = bookings[0];

            // Increment coupon usage within same transaction
            if (couponResult.coupon) {
                await incrementCouponUsage(couponResult.coupon._id.toString(), session);

                // Detailed Audit Log
                await CouponUsage.create([{
                    couponId: couponResult.coupon._id,
                    userId: newBooking.userId || newBooking._id, // Fallback if userId is missing (guest)
                    bookingId: newBooking._id,
                    discountAmount: couponResult.discountAmount
                }], { session });
            }
        });

        return {
            success: true,
            booking: newBooking,
            bookingId: newBooking._id.toString()
        };
    } catch (error: any) {
        // Transaction automatically rolled back on error
        return {
            success: false,
            error: error.message || 'Failed to create booking'
        };
    } finally {
        session.endSession();
    }
}
