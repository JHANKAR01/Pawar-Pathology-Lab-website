
import { Booking, BookingStatus, User, UserRole } from '../types';

const DB_KEYS = {
  BOOKINGS: 'pawar_lab_bookings',
  AUTH_TOKEN: 'pawar_lab_auth_token',
  SETTINGS: 'pawar_lab_settings'
};

// Initial Mock Users
const MOCK_USERS: User[] = [
  { id: 'admin', name: 'Admin Head', email: 'admin', role: UserRole.ADMIN },
  { id: 'partner', name: 'Lab Partner', email: 'partner', role: UserRole.PARTNER },
  // Changed id/email from 'user' to 'patient' to ensure distinct separation
  { id: 'patient', name: 'Regular Patient', email: 'patient', role: UserRole.PATIENT }
];

export const mockApi = {
  // --- Auth Methods ---
  login: async (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = MOCK_USERS.find(u => u.email === email);
        if (user && password === email) {
          const sessionUser = { ...user, token: `mock-jwt-${user.id}-${Date.now()}` };
          localStorage.setItem(DB_KEYS.AUTH_TOKEN, JSON.stringify(sessionUser));
          resolve(sessionUser);
        } else {
          reject(new Error('Invalid credentials.'));
        }
      }, 500);
    });
  },

  logout: () => {
    localStorage.removeItem(DB_KEYS.AUTH_TOKEN);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(DB_KEYS.AUTH_TOKEN);
    return data ? JSON.parse(data) : null;
  },

  // --- Settings Methods ---
  getSettings: () => {
    const data = localStorage.getItem(DB_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { requireVerification: true };
  },

  updateSettings: (settings: { requireVerification: boolean }) => {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  },

  // --- Booking Methods (Global Pool) ---
  getBookings: (): Booking[] => {
    const data = localStorage.getItem(DB_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  },

  saveBooking: (booking: Partial<Booking>) => {
    const bookings = mockApi.getBookings();
    const newBooking = {
      ...booking,
      id: 'PL-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      status: booking.status || BookingStatus.PENDING,
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString()
    } as Booking;
    
    localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify([...bookings, newBooking]));
    return newBooking;
  },

  updateBookingStatus: (id: string, status: BookingStatus) => {
    const currentUser = mockApi.getCurrentUser();
    const settings = mockApi.getSettings();
    
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PARTNER)) {
      throw new Error('Unauthorized');
    }

    const bookings = mockApi.getBookings();
    const updated = bookings.map(b => {
      if (b.id === id) {
        // Verification Logic
        if (status === BookingStatus.REPORT_UPLOADED && !settings.requireVerification) {
          return { ...b, status: BookingStatus.COMPLETED };
        }
        return { ...b, status };
      }
      return b;
    });
    localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(updated));
    return updated.find(b => b.id === id);
  }
};
