'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mockApi } from '@/lib/mockApi';
import { BookingStatus } from '@/types';
import { 
  FlaskConical, LogOut, CheckCircle, Loader2, 
  FileText, CalendarDays, ShieldX 
} from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = mockApi.getCurrentUser();
    if (!user) {
      router.push('/login');
    } else {
      setCurrentUser(user);
    }
  }, [router]);

  useEffect(() => {
    if (currentUser?.email) {
      const fetchBookings = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/bookings?email=${currentUser.email}`);
          if (response.ok) {
            const data = await response.json();
            setMyBookings(data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          }
        } catch (error) {
          console.error("Failed to fetch user's bookings", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBookings();
    }
  }, [currentUser]);

  const handleLogout = () => {
    mockApi.logout();
    window.location.href = '/';
  };

  if (!currentUser) {
    // Render a loading state or null while redirecting
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50/50">
        <Loader2 className="animate-spin text-rose-600" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {/* Simplified Navbar */}
      <div className="fixed top-0 left-0 w-full z-50 transition-all duration-700 px-4 md:px-12 pt-2 md:pt-4">
        <nav className="max-w-[1440px] mx-auto glass-pro rounded-[1.5rem] md:rounded-[2.5rem] px-4 md:px-8 py-3 flex justify-between items-center shadow-2xl">
          <Link href="/" className="flex items-center gap-4 cursor-pointer">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center">
              <FlaskConical className="text-white w-6 h-6" />
            </div>
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
            <h2 className="text-4xl font-black text-slate-900 mb-2 text-center">Patient Portal</h2>
            <p className="text-center text-slate-500 mb-12">Your Digital Health Records</p>
            
            {isLoading ? (
              <div className="text-center">
                <Loader2 className="animate-spin text-rose-600 mx-auto" size={32} />
                <p className="mt-4 text-slate-500">Fetching your reports...</p>
              </div>
            ) : myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.map(booking => (
                  <div key={booking._id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 p-6 bg-slate-50/70 border border-slate-100 rounded-2xl">
                    <div>
                      <h3 className="font-bold text-base md:text-lg text-slate-800">{booking.tests.map((t: any) => t.title).join(', ')}</h3>
                      <div className="flex items-center gap-2 text-slate-500 mt-1">
                        <CalendarDays size={14} />
                        <p className="text-xs md:text-sm">
                          {new Date(booking.scheduledDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      {booking.status === BookingStatus.COMPLETED ? (
                        <div className="flex items-center gap-2 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1">
                          <CheckCircle size={14} />
                          <span className="font-bold text-xs uppercase">Ready</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-full bg-amber-100 text-amber-800 px-3 py-1">
                          <Loader2 size={14} className="animate-spin" />
                          <span className="font-bold text-xs uppercase">Analyzing</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                       <a
                          href={booking.reportFileUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-disabled={!booking.reportFileUrl || booking.status !== BookingStatus.COMPLETED}
                          className={`bg-rose-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-rose-200 transition-all inline-flex items-center gap-2 ${
                            (!booking.reportFileUrl || booking.status !== BookingStatus.COMPLETED) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-700'
                          }`}
                          onClick={(e) => (!booking.reportFileUrl || booking.status !== BookingStatus.COMPLETED) && e.preventDefault()}
                        >
                          <FileText size={14}/>
                          <span>Download</span>
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

      {/* Simplified Footer */}
      <footer className="bg-slate-950 text-white py-16 px-12">
        <div className="max-w-[1440px] mx-auto text-center">
            <p className="text-slate-500">&copy; {new Date().getFullYear()} Pawar Pathology Lab. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
