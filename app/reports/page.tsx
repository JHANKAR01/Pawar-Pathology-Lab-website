'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BookingStatus, IBooking } from '@/types';
import {
  FlaskConical, LogOut, CheckCircle, Loader2,
  FileText, CalendarDays, ShieldX, ChevronDown,
  User, MapPin, Phone, Edit2, X
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

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ phone: '', address: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
      setProfileForm({
        phone: session.user.phone || '',
        address: session.user.address || ''
      });
      setIsVerified(true);
    }
  }, [status, session]);

  useEffect(() => {
    if (isVerified && currentUser?.id) {
      const fetchBookings = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/bookings?userId=${currentUser.id}`);
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

  const stats = useMemo(() => {
    const total = allBookings.length;
    const completed = allBookings.filter(b => b.status === BookingStatus.COMPLETED).length;
    const active = total - completed - allBookings.filter(b => b.status === BookingStatus.CANCELLED).length;
    return { total, completed, active };
  }, [allBookings]);

  const handleLogout = () => {
    toast.success("Logged out successfully");
    const { signOut } = require('next-auth/react');
    signOut({ callbackUrl: '/login' });
  };

  const handleCancel = async (bookingId: string) => {
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser((prev: any) => ({ ...prev, ...data.user }));
        toast.success("Profile updated successfully");
        setIsEditingProfile(false);
        // Ideally notify NextAuth session update, but local state update works for UI now
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update profile");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSavingProfile(false);
    }
  };


  // --- Helper Components ---
  const StatusTracker = ({ status }: { status: string }) => {
    // simplified status mapping
    const steps = [
      { key: 'pending', label: 'Received' },
      { key: 'accepted', label: 'Processing' },
      { key: 'completed', label: 'Ready' }
    ];

    // Determine current step index
    let currentStepIndex = -1;
    if (status === 'pending') currentStepIndex = 0;
    else if (status === 'accepted' || status === 'report_uploaded') currentStepIndex = 1;
    else if (status === 'completed') currentStepIndex = 2;
    else if (status === 'cancelled') return <span className="text-red-500 font-bold text-xs uppercase px-3 py-1 bg-red-50 rounded-full">Cancelled</span>;

    return (
      <div className="flex items-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.key} className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${idx <= currentStepIndex ? 'bg-emerald-500' : 'bg-slate-200'} transition-all`} />
            {idx < steps.length - 1 && (
              <div className={`w-8 h-1 ${idx < currentStepIndex ? 'bg-emerald-500' : 'bg-slate-200'} mx-1 transition-all`} />
            )}
          </div>
        ))}
        <span className="text-xs font-bold uppercase text-slate-500 ml-2">
          {currentStepIndex === 2 ? 'Report Ready' : steps[Math.max(0, currentStepIndex)].label}
        </span>
      </div>
    );
  };


  if (status === 'loading' || (!isVerified && status === 'authenticated')) {
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

  if (!isVerified || !currentUser) return null;

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
        <section id="my-reports" className="px-4 md:px-12 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">

          {/* Profile & Stats Sidebar */}
          <div className="space-y-8">
            {/* Profile Card */}
            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100">
              <div className="flex justify-between items-start mb-4">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                  <User size={32} />
                </div>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-xl transition-all hover:bg-rose-50"
                >
                  {isEditingProfile ? <X size={20} /> : <Edit2 size={20} />}
                </button>
              </div>

              {!isEditingProfile ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{currentUser.name}</h3>
                    <p className="text-sm text-slate-500">{currentUser.email}</p>
                  </div>
                  <div className="pt-4 space-y-2 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone size={16} className="text-rose-500" />
                      <span className="text-sm font-medium">{currentUser.phone || "Add Phone Number"}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <MapPin size={16} className="text-rose-500" />
                      <span className="text-sm font-medium truncate">{currentUser.address || "Add Address"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Phone</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-rose-500"
                      placeholder="Enter 10-digit phone"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Address</label>
                    <textarea
                      value={profileForm.address}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-rose-500 resize-none h-20"
                      placeholder="Enter your address"
                    />
                  </div>
                  <button
                    disabled={isSavingProfile}
                    className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>
              )}
            </div>

            {/* Stats Card */}
            <div className="bg-rose-500 p-6 rounded-[2rem] shadow-xl shadow-rose-200 text-white relative overflow-hidden">
              <div className="relative z-10 grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                  <span className="block text-3xl font-black">{stats.active}</span>
                  <span className="text-xs font-medium opacity-80 uppercase tracking-wide">Active</span>
                </div>
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                  <span className="block text-3xl font-black">{stats.completed}</span>
                  <span className="text-xs font-medium opacity-80 uppercase tracking-wide">Done</span>
                </div>
                <div className="col-span-2 bg-white/10 p-4 rounded-xl backdrop-blur-sm flex justify-between items-center">
                  <div>
                    <span className="block text-3xl font-black">{stats.total}</span>
                    <span className="text-xs font-medium opacity-80 uppercase tracking-wide">Total Bookings</span>
                  </div>
                  <FlaskConical className="w-8 h-8 opacity-50" />
                </div>
              </div>
            </div>
          </div>


          {/* Main Bookings Feed */}
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-slate-200 h-fit min-h-[500px]">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-10">
              <div className="text-center md:text-left mb-6 md:mb-0">
                <h2 className="text-3xl font-black text-slate-900 mb-2">My Reports</h2>
                <p className="text-slate-500">Track status & download results.</p>
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
                  <option value="year">By Year</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
              </div>
            ) : sortedBookings.length > 0 ? (
              <div className="space-y-4">
                {sortedBookings.map(booking => (
                  <div key={booking._id} className="group relative bg-white border border-slate-100 rounded-3xl p-6 transition-all hover:shadow-xl hover:border-slate-200 hover:-translate-y-1">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      {/* Date Badge */}
                      <div className="bg-slate-50 p-4 rounded-2xl text-center min-w-[80px]">
                        <span className="block text-2xl font-black text-slate-800">{new Date(booking.scheduledDate).getDate()}</span>
                        <span className="block text-xs font-bold text-slate-400 uppercase">{new Date(booking.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-rose-600 transition-colors">
                          {booking.tests.map((t: any) => t.title).join(', ')}
                        </h3>
                        <div className="mt-3 flex flex-col md:flex-row items-center gap-4">
                          <StatusTracker status={booking.status} />
                          {booking.status === 'pending' && (
                            <button onClick={() => handleCancel(booking._id)} className="text-[10px] font-bold text-rose-500 uppercase hover:underline">Cancel Request</button>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <div>
                        <a
                          href={booking.reportFileUrl ? `/api/reports/download/${booking._id}` : '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-disabled={!booking.reportFileUrl || booking.status !== BookingStatus.COMPLETED}
                          className={`h-12 w-12 md:w-auto md:px-6 md:h-12 rounded-xl flex items-center justify-center gap-2 font-bold uppercase text-[10px] tracking-widest transition-all ${(!booking.reportFileUrl || booking.status !== BookingStatus.COMPLETED)
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-rose-600 text-white shadow-lg shadow-rose-200 hover:bg-rose-700'
                            }`}
                          onClick={(e) => {
                            if (!booking.reportFileUrl || booking.status !== BookingStatus.COMPLETED) {
                              e.preventDefault();
                              toast.error("Report not available yet");
                            }
                          }}
                        >
                          <FileText size={18} />
                          <span className="hidden md:inline">Download</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 px-8 border-2 border-dashed border-slate-100 rounded-3xl">
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500"><FlaskConical /></div>
                <h3 className="text-xl font-bold text-slate-900">No Checkups Yet</h3>
                <p className="text-slate-500 mt-2 mb-8 max-w-xs mx-auto">Your health journey starts here. Book your first diagnostic test today.</p>
                <Link href="/" className="inline-block bg-slate-900 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">Book New Test</Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-white py-12 px-12 mt-auto">
        <div className="max-w-[1440px] mx-auto text-center md:text-left flex flex-col md:flex-row justify-between items-center opacity-50 text-sm">
          <p>&copy; {new Date().getFullYear()} Pawar Pathology Lab.</p>
          <p>Betul, Madhya Pradesh</p>
        </div>
      </footer>
    </div>
  );
}
