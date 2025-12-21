export enum UserRole {
  ADMIN = 'admin',
  PARTNER = 'partner',
  PATIENT = 'patient'
}

export enum BookingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  ASSIGNED = 'assigned',
  REACHED = 'reached',
  SAMPLE_COLLECTED = 'sample_collected',
  REPORT_UPLOADED = 'report_uploaded',
  COMPLETED = 'completed',
  DECLINED = 'declined'
}

export enum CollectionType {
  HOME = 'home',
  LAB_VISIT = 'lab_visit'
}

export enum PaymentStatus {
  PAID = 'paid',
  UNPAID = 'unpaid',
  PARTIAL = 'partial'
}

export interface User {
  _id: string;
  id: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  token?: string;
}

export interface Test {
  _id: string;
  id: string;
  title: string;
  price: number;
  category: string;
  testCode: string;
  description: string;
}

export interface IBookingTest {
  id: string;
  title: string;
  price: number;
  category: string;
}

export interface IBooking {
  _id: string;
  id: string;
  patientName: string;
  contactNumber?: string;
  email?: string;
  bookedByEmail?: string;
  userId: string; 
  tests: IBookingTest[];
  totalAmount: number;
  amountTaken: number;
  balanceAmount: number;
  collectionType: CollectionType;
  scheduledDate: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
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

export interface ISettings {
  requireVerification: boolean;
  maintenanceMode: boolean;
  announcement?: string;
}