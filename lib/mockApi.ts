import { Booking, BookingStatus, User, UserRole, CollectionType } from '../types';

const DB_KEYS = {
  BOOKINGS: 'pawar_lab_bookings',
  AUTH_TOKEN: 'pawar_lab_auth_token',
  SETTINGS: 'pawar_lab_settings'
};

const MOCK_USERS: User[] = [
  { id: 'admin', name: 'Admin Head', email: 'admin', role: UserRole.ADMIN },
  { id: 'partner', name: 'Lab Partner', email: 'partner', role: UserRole.PARTNER },
  { id: 'patient', name: 'Regular Patient', email: 'patient', role: UserRole.PATIENT }
];

export const mockApi = {
  login: async (email: string, password: string): Promise<User> => {
    const user = MOCK_USERS.find(u => u.email === email);
    if (user && password === email) {
      const sessionUser = { ...user, token: `mock-jwt-${user.id}-${Date.now()}` };
      localStorage.setItem(DB_KEYS.AUTH_TOKEN, JSON.stringify(sessionUser));
      return sessionUser;
    } else {
      throw new Error('Invalid credentials. Use admin, partner, or patient as both email and password.');
    }
  },

  logout: () => {
    localStorage.removeItem(DB_KEYS.AUTH_TOKEN);
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(DB_KEYS.AUTH_TOKEN);
    return data ? JSON.parse(data) : null;
  },

  getSettings: () => {
    if (typeof window === 'undefined') return { requireVerification: true };
    const data = localStorage.getItem(DB_KEYS.SETTINGS);
    return data ? JSON.parse(data) : { requireVerification: true };
  },

  updateSettings: (settings: { requireVerification: boolean }) => {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
    return settings;
  },

  getBookings: (): Booking[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(DB_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  },

  saveBooking: (booking: Partial<Booking>) => {
    const bookings = mockApi.getBookings();
    const generatedId = 'PL-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const newBooking = {
      ...booking,
      id: generatedId,
      _id: generatedId,
      status: booking.status || BookingStatus.PENDING,
      amountTaken: booking.amountTaken || 0,
      balanceAmount: booking.balanceAmount || (booking.totalAmount || 0),
      paymentStatus: (booking.balanceAmount === 0) ? 'paid' : 'unpaid',
      createdAt: new Date().toISOString()
    } as Booking;
    
    localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify([...bookings, newBooking]));
    return newBooking;
  },

  updateBooking: (id: string, updates: Partial<Booking>) => {
    const bookings = mockApi.getBookings();
    const updated = bookings.map(b => (b.id === id || b._id === id) ? { ...b, ...updates } : b);
    localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(updated));
    return updated.find(b => b.id === id || b._id === id);
  },

  updateBookingStatus: (id: string, status: BookingStatus, extra = {}) => {
    const bookings = mockApi.getBookings();
    const updated = bookings.map(b => {
      if (b.id === id || b._id === id) {
        return { ...b, status, ...extra };
      }
      return b;
    });
    localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(updated));
    return updated.find(b => b.id === id || b._id === id);
  }
};