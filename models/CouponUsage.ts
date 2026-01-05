
import mongoose, { Schema, models, model } from 'mongoose';

const CouponUsageSchema = new Schema({
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    usedAt: { type: Date, default: Date.now },
    discountAmount: { type: Number, required: true }
}, { timestamps: true });

export default models.CouponUsage || model('CouponUsage', CouponUsageSchema);
