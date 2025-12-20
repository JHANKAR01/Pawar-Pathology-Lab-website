
import mongoose, { Schema, Document, models, model } from 'mongoose';

/**
 * ------------------------------------------------------------------
 * ENUMS & TYPES
 * ------------------------------------------------------------------
 * defined to ensure strict adherence to business logic states.
 */

export enum BookingStatus {
  PENDING = 'pending',                // Booking created, no action taken
  CONFIRMED = 'confirmed',            // Admin/Partner saw it (optional step)
  SAMPLE_COLLECTED = 'sample_collected', // Phlebo has visited/patient arrived
  REPORT_UPLOADED = 'report_uploaded',   // PDF is on Google Drive, awaiting verification
  COMPLETED = 'completed'             // Verified and released to patient
}

export enum CollectionType {
  HOME = 'home',
  LAB_VISIT = 'lab_visit'
}

export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid'
}

/**
 * ------------------------------------------------------------------
 * INTERFACES
 * ------------------------------------------------------------------
 * TypeScript definitions for type safety in API routes and Components.
 */

// Sub-document interface for a single test inside a booking
interface IBookingTest {
  id: string;
  title: string;
  price: number; // Stored here to lock the price at booking time
  category: string;
}

export interface IBooking extends Document {
  patientName: string;
  contactNumber?: string;
  email?: string;
  
  // The 'Snapshot' of tests booked. We do not use an ObjectId reference 
  // here because if the price of a test changes next month, old invoices 
  // should not change. We store the full object.
  tests: IBookingTest[];
  
  totalAmount: number;
  collectionType: CollectionType;
  
  // Geo-location fields could be added here in Phase 2
  address?: string; 
  
  scheduledDate: Date;
  status: BookingStatus;
  
  paymentMode: 'online' | 'cash';
  paymentStatus: PaymentStatus;
  
  // CRITICAL: This field stores the 'WebViewLink' returned by the Google Drive API
  reportFileUrl?: string; 
  
  // For auditing who created this booking (if utilizing Partner Dashboard)
  createdBy?: string; 
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ------------------------------------------------------------------
 * MONGOOSE SCHEMA DEFINITION
 * ------------------------------------------------------------------
 */
const BookingSchema = new Schema<IBooking>(
  {
    patientName: { 
      type: String, 
      required: [true, 'Patient name is required'],
      trim: true,
      index: true // Indexed for faster search in Partner/Admin dashboards
    },
    contactNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },

    tests: [{
      _id: false, // We don't need a sub-document ID for the test snapshot
      id: String,
      title: String,
      price: Number,
      category: String
    }],

    totalAmount: { 
      type: Number, 
      required: true,
      min: [0, 'Amount cannot be negative'] 
    },

    collectionType: {
      type: String,
      enum: Object.values(CollectionType),
      default: CollectionType.LAB_VISIT,
      required: true
    },

    address: { type: String, trim: true }, // Only relevant if collectionType === HOME

    scheduledDate: { 
      type: Date, 
      required: true 
    },

    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      index: true // Indexed for filtering active vs completed jobs
    },

    paymentMode: { 
      type: String, 
      enum: ['online', 'cash'], 
      default: 'cash' 
    },

    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID
    },

    // This URL is populated after the Partner uploads a PDF via the dashboard.
    // It links directly to the file in the Google Drive "PawarLabs_Reports" folder.
    reportFileUrl: { type: String },
  },
  { 
    timestamps: true // Automatically manages createdAt and updatedAt
  }
);

/**
 * ------------------------------------------------------------------
 * MODEL EXPORT
 * ------------------------------------------------------------------
 * We use `models.Booking || model(...)` to prevent Mongoose from 
 * throwing an OverwriteModelError during Next.js hot-reloading 
 * in development mode.
 */
const Booking = models.Booking || model<IBooking>('Booking', BookingSchema);

export default Booking;
