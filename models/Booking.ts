import mongoose, { Schema, Document, models, model } from 'mongoose';
import { BookingStatus, CollectionType, PaymentStatus, IBooking, IBookingTest } from '@/types';

const BookingSchema = new Schema<IBooking & Document>(
  {
    patientName: { type: String, required: true, trim: true, index: true },
    contactNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    bookedByEmail: { type: String, trim: true, lowercase: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    tests: [{
      _id: false,
      id: String,
      title: String,
      price: Number,
      category: String
    }],
    totalAmount: { type: Number, required: true },
    amountTaken: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    collectionType: {
      type: String,
      enum: Object.values(CollectionType),
      default: CollectionType.LAB_VISIT,
      required: true
    },
    address: { type: String, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    scheduledDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      index: true
    },
    paymentMode: { type: String, enum: ['online', 'cash'], default: 'cash' },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.UNPAID },
    reportFileUrl: { type: String },
    referredBy: { type: String, default: 'Self' },
    assignedPartnerId: { type: String },
    assignedPartnerName: { type: String }
  },
  { timestamps: true }
);

const Booking = models.Booking || model<IBooking & Document>('Booking', BookingSchema);
export default Booking;