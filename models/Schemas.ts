
import mongoose from 'mongoose';

// --- USER SCHEMA ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }, // Should be hashed in production
  role: { type: String, enum: ['patient', 'admin', 'partner'], default: 'patient' },
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
  patientId: { type: String, required: true }, // Linking to User or Guest ID
  patientName: { type: String, required: true },
  tests: [{ type: Object }], // Store test snapshots to prevent price-change issues
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
  assignedPartnerId: { type: String },
  verifiedBy: { type: String }, // Admin ID who verified the report
}, { timestamps: true });

// --- SETTINGS SCHEMA (New for Admin controls) ---
const settingsSchema = new mongoose.Schema({
  requireVerification: { type: Boolean, default: true },
  updatedBy: { type: String },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Test = mongoose.models.Test || mongoose.model('Test', testSchema);
export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
