import mongoose, { Schema, Document, models, model } from 'mongoose';

export enum BookingStatus {
  PENDING = 'pending',                // Booking created by patient
  ACCEPTED = 'accepted',              // Admin accepted the booking
  ASSIGNED = 'assigned',              // Admin assigned a partner
  REACHED = 'reached',                // Partner reached patient location
  SAMPLE_COLLECTED = 'sample_collected', // Partner collected sample
  REPORT_UPLOADED = 'report_uploaded',   // Partner uploaded report
  COMPLETED = 'completed'             // Admin verified and released
}

export enum CollectionType {
  HOME = 'home',
  LAB_VISIT = 'lab_visit'
}

export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid'
}

interface IBookingTest {
  id: string;
  title: string;
  price: number;
  category: string;
}

export interface IBooking extends Document {
  patientName: string;
  contactNumber?: string;
  email?: string;
  tests: IBookingTest[];
  totalAmount: number;
  collectionType: CollectionType;
  address?: string; 
  coordinates?: {
    lat: number;
    lng: number;
  };
  scheduledDate: Date;
  status: BookingStatus;
  paymentMode: 'online' | 'cash';
  paymentStatus: PaymentStatus;
  reportFileUrl?: string; 
  assignedPartnerId?: string; // ID of the partner assigned to this booking
  assignedPartnerName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    patientName: { type: String, required: true, trim: true, index: true },
    contactNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    tests: [{
      _id: false,
      id: String,
      title: String,
      price: Number,
      category: String
    }],
    totalAmount: { type: Number, required: true },
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
    assignedPartnerId: { type: String },
    assignedPartnerName: { type: String }
  },
  { timestamps: true }
);

const Booking = models.Booking || model<IBooking>('Booking', BookingSchema);
export default Booking;