export enum UserRole {
  ADMIN = 'admin',
  PARTNER = 'partner',
  PATIENT = 'patient',
  MASTER = 'master'
}

export enum BookingStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  ASSIGNED = 'assigned',
  REACHED = 'reached',
  SAMPLE_COLLECTED = 'sample_collected',
  REPORT_UPLOADED = 'report_uploaded',
  COMPLETED = 'completed',
  DECLINED = 'declined',
  CANCELLED = 'cancelled'
}

export enum ReportStatus {
  PENDING_REVIEW = 'pending_review',
  RELEASED = 'released',
  REJECTED = 'rejected'
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
  address?: string;
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
  userId: any; // Flexible for ObjectId
  tests: IBookingTest[];
  totalAmount: number;
  amountTaken: number;
  balanceAmount: number;
  collectionType: CollectionType;
  scheduledDate: any; // Flexible for Date objects
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
  reportStatus?: ReportStatus;
  pathologistNotes?: string;
  createdAt: string;
  updatedAt: string;
  // Missing fields from schema
  couponCode?: string;
  discountAmount?: number;
  distanceFromLab?: number;
  reportFileId?: string;
}

export interface ISettings {
  requireVerification: boolean;
  maintenanceMode: boolean;
  maintenanceModeUser: boolean;
  maintenanceModePartner: boolean;
  announcement?: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  whatsappOfficialEnabled?: boolean;
  telegramEnabled?: boolean;
  telegramAdminChatId?: string;

  // Role-based Telegram Toggles
  telegramEnabledAdmin?: boolean;
  telegramEnabledPartner?: boolean;
  telegramEnabledUser?: boolean;
  serviceRadius: number;
  locationFencingEnabled: boolean;
  distanceType: 'road' | 'displacement';
  blockSundays: boolean;
  planFlags?: {
    allowWhatsApp: boolean;
    allowSundayBookings: boolean;
    allowDriveInfrastructure: boolean;
    allowBlackoutManagement: boolean;
  };
}