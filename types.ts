
export enum UserRole {
  ADMIN = 'admin',
  WORKER = 'worker',
  PATIENT = 'patient'
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SAMPLE_COLLECTED = 'sample_collected',
  REPORT_UPLOADED = 'report_uploaded',
  COMPLETED = 'completed'
}

export enum CollectionType {
  HOME = 'home',
  LAB_VISIT = 'lab_visit'
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  address?: string;
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
  id: string;
  patientId: string;
  patientName: string;
  tests: Test[];
  totalAmount: number;
  discountApplied: number;
  collectionType: CollectionType;
  scheduledDate: string;
  status: BookingStatus;
  paymentStatus: 'paid' | 'unpaid';
  reportFileUrl?: string;
  assignedWorkerId?: string;
}
