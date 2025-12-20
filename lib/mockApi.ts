
import { Booking, BookingStatus, Test } from '../types';

const DB_KEYS = {
  BOOKINGS: 'pawar_lab_bookings'
};

export const mockApi = {
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
    const bookings = mockApi.getBookings();
    const updated = bookings.map(b => 
      b.id === id ? { ...b, status } : b
    );
    localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(updated));
  }
};
