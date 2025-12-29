import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number; // Percentage (0-100) or fixed amount in rupees
  expiryDate: Date;
  isActive: boolean;
  usageLimit?: number; // Optional: max number of times this coupon can be used
  usedCount: number; // Track how many times it's been used
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    expiryDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    usageLimit: {
      type: Number,
      min: 1
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

// Index for faster lookups
CouponSchema.index({ code: 1, isActive: 1, expiryDate: 1 });

const Coupon = models.Coupon || model<ICoupon>('Coupon', CouponSchema);
export default Coupon;

