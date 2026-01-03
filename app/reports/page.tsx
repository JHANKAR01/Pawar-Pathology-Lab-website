'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BookingStatus, IBooking } from '@/types';
import {
  FlaskConical, LogOut, CheckCircle, Loader2,
  FileText, CalendarDays, ShieldX, ChevronDown
} from 'lucide-react';

type SortOption = 'newest' | 'oldest' | 'month' | 'year';

import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';

export default function ReportsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allBookings, setAllBookings] = useState<IBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      setCurrentUser(session.user);
      setIsVerified(true);
    }
  }, [status, session]);

  useEffect(() => {
    if (isVerified && currentUser?.id) { // Use .id, not ._id
      const fetchBookings = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/bookings?userId=${currentUser.id}`); // Use .id
          if (response.ok) {
            const data = await response.json();
            setAllBookings(data);
          }
        } catch (error) {
          console.error("Failed to fetch user's bookings", error);
          toast.error("Failed to fetch reports");
        } finally {
          setIsLoading(false);
        }
      };
      fetchBookings();
    }
  }, [isVerified, currentUser]);

  const sortedBookings = useMemo(() => {
    return [...allBookings].sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      switch (sortOption) {
        case 'oldest':
          return dateA.getTime() - dateB.getTime();
        case 'month':
          return dateA.getMonth() - dateB.getMonth();
        case 'year':
          return dateB.getFullYear() - dateA.getFullYear();
        case 'newest':
        default:
          return dateB.getTime() - dateA.getTime();
      }
    });
  }, [allBookings, sortOption]);

  const handleLogout = () => {
    toast.success("Logged out successfully");
    const { signOut } = require('next-auth/react');
    signOut({ callbackUrl: '/login' });
  };

  const handleCancel = async (bookingId: string) => {
    // using window.confirm for now as sonner doesn't have a confirmation modal built-in, 
    // but could replace with a custom dialog component later.
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        setAllBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: BookingStatus.CANCELLED } : b));
        toast.success("Booking cancelled successfully");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to cancel");
      }
    } catch (e) { toast.error("Error cancelling booking"); }
  };

  if (status === 'loading' || (!isVerified && status === 'authenticated')) {
    // Initial page load skeleton
    return (
      <div className="flex flex-col min-h-screen bg-slate-100">
        <div className="pt-40 px-12 max-w-[1440px] mx-auto w-full">
          <Skeleton className="h-12 w-48 mb-6 rounded-xl" />
          <div className="bg-white rounded-[3rem] p-12 shadow-2xl space-y-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!isVerified || !currentUser) return null; // Should redirect

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <div className="fixed top-0 left-0 w-full z-50 transition-all duration-700 px-4 md:px-12 pt-2 md:pt-4">
        <nav className="max-w-[1440px] mx-auto glass-pro rounded-[1.5rem] md:rounded-[2.5rem] px-4 md:px-8 py-3 flex justify-between items-center shadow-2xl">
          <Link href="/" className="flex items-center gap-4 cursor-pointer">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center"><FlaskConical className="text-white w-6 h-6" /></div>
            <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tighter uppercase">PAWAR<span className="text-rose-600">LAB</span></h2>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-xs font-black uppercase text-slate-500">Hi, {currentUser.name}</span>
            <button onClick={handleLogout} className="p-3 bg-white/5 border-2 border-slate-100 rounded-2xl text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </div>

      <main className="flex-1 pt-40 pb-24">
        <section id="my-reports" className="px-4 md:px-12">
          <div className="max-w-[1440px] mx-auto p-8 md:p-12 bg-white rounded-[3rem] shadow-2xl shadow-slate-200">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-12">
              <div className="text-center md:text-left mb-6 md:mb-0">
                <h2 className="text-4xl font-black text-slate-900 mb-2">Patient Portal</h2>
                <p className="text-slate-500">Your Digital Health Records</p>
              </div>
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="appearance-none bg-slate-50 border border-slate-200 font-bold text-slate-700 rounded-xl px-6 py-3 pr-12 outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="month">By Month</option>
                  <option value="year">By Year (Desc)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
              </div>
            ) : sortedBookings.length > 0 ? (
              <div className="space-y-4">
                {sortedBookings.map(booking => (
                  <div key={booking._id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-6 bg-slate-50/70 border border-slate-100 rounded-2xl transition-all hover:bg-white hover:shadow-lg hover:border-rose-100">
                    <div>
                      <h3 className="font-bold text-base md:text-lg text-slate-800">{booking.tests.map((t: any) => t.title).join(', ')}</h3>
                      <div className="flex items-center gap-2 text-slate-500 mt-1">
                        <CalendarDays size={14} />
                        <p className="text-xs md:text-sm">{new Date(booking.scheduledDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      {booking.status === BookingStatus.COMPLETED ? (
                        <div className="flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1"><CheckCircle size={14} /><span className="font-bold text-xs uppercase">Ready</span></div>
                      ) : booking.status === BookingStatus.CANCELLED ? (
                        <div className="flex items-center gap-2 rounded-full bg-red-100 text-red-800 px-3 py-1"><ShieldX size={14} /><span className="font-bold text-xs uppercase">Cancelled</span></div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2 rounded-full bg-amber-100 text-amber-800 px-3 py-1"><Loader2 size={14} className="animate-spin" /><span className="font-bold text-xs uppercase">Processing</span></div>
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(booking._id)}
                              className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline uppercase tracking-wider"
                            >
                              Cancel Booking
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <a
                        href={booking.reportFileUrl ? `/api/reports/download/${booking._id}` : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={!booking.reportFileUrl || booking.status !== BookingStatus.COMPLETED}
                        className={`bg-rose-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 transition-all inline-flex items-center gap-2 ${(!booking.reportFileUrl || booking.status !== BookingStatus.COMPLETED) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-700'
                          }`}
                        onClick={(e) => {
                          if (!booking.reportFileUrl || booking.status !== BookingStatus.COMPLETED) {
                            e.preventDefault();
                            toast.error("Report not available yet");
                          }
                        }}
                      >
                        <FileText size={14} /><span>Download</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                <ShieldX size={48} className="mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-bold text-slate-700">No Reports Found</h3>
                <p className="text-slate-500 mt-2">It looks like you haven't booked any tests with us yet.</p>
                <Link href="/" className="mt-6 inline-block bg-rose-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all">Book a Test</Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-white py-16 px-12">
        <div className="max-w-[1440px] mx-auto text-center"><p className="text-slate-500">&copy; {new Date().getFullYear()} Pawar Pathology Lab. All Rights Reserved.</p></div>
      </footer>
    </div>
  );
}
