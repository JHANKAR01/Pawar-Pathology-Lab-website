
/**
 * Note: These are standard Mongoose schema definitions for use in a Node.js/Mongoose environment.
 */

// import mongoose from 'mongoose';

/*
// --- USER SCHEMA ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }, // Should be hashed
  role: { type: String, enum: ['patient', 'admin', 'worker'], default: 'patient' },
  address: { type: String, default: 'Betul, Madhya Pradesh' },
}, { timestamps: true });

// --- TEST SCHEMA ---
const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  isHomeCollectionAvailable: { type: Boolean, default: true },
  fastingRequired: { type: Boolean, default: false },
});

// --- BOOKING SCHEMA ---
const bookingSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  totalAmount: { type: Number, required: true },
  discountApplied: { type: Number, default: 0 },
  collectionType: { type: String, enum: ['home', 'lab_visit'], required: true },
  scheduledDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'sample_collected', 'report_uploaded', 'completed'],
    default: 'pending' 
  },
  paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  reportFileUrl: { type: String },
  assignedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// --- COUPON SCHEMA ---
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountPercentage: { type: Number, required: true },
  maxDiscountAmount: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Test = mongoose.models.Test || mongoose.model('Test', testSchema);
export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);
*/
