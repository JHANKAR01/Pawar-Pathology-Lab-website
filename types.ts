

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

export interface Booking {
  _id: string;
  id: string; // Added id property to unify mock and database representations
  patientName: string;
  contactNumber?: string;
  email?: string;
  tests: Test[];
  totalAmount: number;
  collectionType: CollectionType;
  scheduledDate: string;
  status: BookingStatus;
  paymentStatus: 'paid' | 'unpaid';
  paymentMode: 'online' | 'cash';
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  reportFileUrl?: string;
  createdAt: string;
}