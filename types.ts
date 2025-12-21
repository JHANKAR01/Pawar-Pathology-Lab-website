
export enum UserRole {
  ADMIN = 'admin',
  PARTNER = 'partner',
  PATIENT = 'patient'
}

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

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  token?: string;
}

export interface Test {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
  isHomeCollectionAvailable: boolean;
  fastingRequired: boolean;
}

export interface IBooking {
  _id: string;
  id: string;
  patientName: string;
  contactNumber?: string;
  email?: string;
  bookedByEmail?: string;
  userId: string; // Should be a string representation of ObjectId
  tests: Test[];
  totalAmount: number;
  amountTaken: number;
  balanceAmount: number;
  collectionType: CollectionType;
  scheduledDate: string;
  status: BookingStatus;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  paymentMode: 'online' | 'cash';
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  referredBy?: string;
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  reportFileUrl?: string;
  createdAt: string;
  updatedAt: string;
}
