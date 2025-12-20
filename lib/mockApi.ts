
import { Booking, BookingStatus, User, UserRole } from '../types';

const DB_KEYS = {
  BOOKINGS: 'pawar_lab_bookings',
  AUTH_TOKEN: 'pawar_lab_auth_token'
};

// Updated Mock user database with requested credentials
const MOCK_USERS: User[] = [
  { id: 'admin', name: 'Admin Head', email: 'admin', role: UserRole.ADMIN },
  { id: 'partner', name: 'Lab Partner', email: 'partner', role: UserRole.PARTNER },
  { id: 'user', name: 'Regular User', email: 'user', role: UserRole.PATIENT }
];

export const mockApi = {
  // --- Auth Methods ---
  login: async (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Find user by matching email (used as ID in the prompt request)
        const user = MOCK_USERS.find(u => u.email === email);
        
        // Match credentials based on user request (id/pass match)
        // admin/admin, partner/partner, user/user
        if (user && password === email) {
          const sessionUser = { ...user, token: `mock-jwt-${user.id}-${Date.now()}` };
          localStorage.setItem(DB_KEYS.AUTH_TOKEN, JSON.stringify(sessionUser));
          resolve(sessionUser);
        } else {
          reject(new Error('Invalid credentials. Please use the assigned ID and Password.'));
        }
      }, 800);
    });
  },

  logout: () => {
    localStorage.removeItem(DB_KEYS.AUTH_TOKEN);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(DB_KEYS.AUTH_TOKEN);
    return data ? JSON.parse(data) : null;
  },

  // --- Booking Methods ---
  getBookings: (): Booking[] => {
    const data = localStorage.getItem(DB_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  },

  saveBooking: (booking: Partial<Booking>) => {
    const bookings = mockApi.getBookings();
    const newBooking = {
      ...booking,
      id: 'PL-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      status: BookingStatus.PENDING,
      paymentStatus: 'unpaid',
      createdAt: new Date().toISOString()
    } as Booking;
    
    localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify([...bookings, newBooking]));
    return newBooking;
  },

  updateBookingStatus: (id: string, status: BookingStatus) => {
    const currentUser = mockApi.getCurrentUser();
    
    // API Route Protection Logic
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.PARTNER)) {
      throw new Error('Unauthorized: Only Partners and Admins can update booking statuses.');
    }

    const bookings = mockApi.getBookings();
    const updated = bookings.map(b => 
      b.id === id ? { ...b, status } : b
    );
    localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(updated));
  }
};
