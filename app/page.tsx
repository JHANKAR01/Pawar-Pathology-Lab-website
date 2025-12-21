'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Phone, MapPin, FlaskConical, LogIn, Activity, 
  Award, Zap, Globe, Instagram, Facebook, Clock, 
  CheckCircle, FileDown, LayoutDashboard, ChevronRight,
  ClipboardList, Navigation, ShieldCheck, UserCheck, LogOut, X,
  FileText, CalendarDays, Loader2
} from 'lucide-react';
import TestSearch from '@/components/TestSearch';
import BookingWizard from '@/components/BookingWizard';
import { Test, CollectionType, BookingStatus } from '@/types';

const Hero3DContainer = dynamic(() => import('@/components/3D/Hero3DContainer'), {
  ssr: false,
  loading: () => <div className="relative h-[90vh] md:h-screen w-full overflow-hidden bg-[#050505]" />
});

export default function Home() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch('/api/tests');
        if (response.ok) {
          const data = await response.json();
          setTests(data);
        } else {
          console.error('Failed to fetch tests');
        }
      } catch (error) {
        console.error('An error occurred while fetching tests:', error);
      }
    };

    fetchTests();
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    const user = JSON.parse(localStorage.getItem('pawar_lab_auth_token') || '{}');
    if(user?._id) {
      setCurrentUser(user);
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookingComplete = async (bookingData: any) => {
    try {
      const { name, phone, date, paymentMethod, time, ...rest } = bookingData;
      const payload = {
        ...rest,
        patientName: name,
        contactNumber: phone,
        scheduledDate: date,
        paymentMode: paymentMethod,
        tests: selectedTests.map(({ _id, title, price, category }) => ({ id: _id, title, price, category })),
        status: BookingStatus.PENDING,
        bookedByEmail: currentUser?.email || 'guest',
        userId: currentUser?._id,
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSelectedTests([]);
        setIsWizardOpen(false);
        setBookingSuccess(true);
      } else {
        const errorData = await response.json();
        alert(`Booking failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Booking failed', error);
      alert('An unexpected error occurred during booking.');
    }
  };

  const handleTestSelect = (test: Test) => {
    if (!currentUser) {
      alert("Please login to schedule investigations.");
      router.push('/login');
      return;
    }
    if (selectedTests.find(t => t._id === test._id)) {
      setSelectedTests(prev => prev.filter(t => t._id !== test._id));
    } else {
      setSelectedTests(prev => [...prev, test]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pawar_lab_auth_token');
    router.push('/login');
  };
  
  const navItems = ['Test Directory', 'Clinical Services', 'Help & Support'];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 px-4 md:px-12 ${isScrolled ? 'pt-2 md:pt-4' : 'pt-4 md:pt-8'}`}>
        <nav className={`max-w-[1440px] mx-auto glass-pro rounded-[1.5rem] md:rounded-[2.5rem] px-4 md:px-8 py-3 flex justify-between items-center shadow-2xl transition-all ${isScrolled ? 'py-3' : 'py-5'}`}>
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center">
              <FlaskConical className="text-white w-6 h-6" />
            </div>
            <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tighter uppercase">PAWAR<span className="text-rose-600">LAB</span></h2>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {navItems.map(item => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-rose-600 transition-all"
              >
                {item}
              </a>
            ))}
            {currentUser?.role === 'patient' && (
              <Link href="/reports" className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-600 hover:text-rose-700 transition-all">My Reports</Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
               <div className="flex items-center gap-4">
                  <span className="hidden md:block text-xs font-black uppercase text-slate-500">Hi, {currentUser.name}</span>
                  {currentUser.role === 'admin' && (
                    <Link href="/admin" className="px-6 py-3 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-rose-600 hover:text-rose-600 transition-all">Go to Dashboard</Link>
                  )}
                  {currentUser.role === 'partner' && (
                    <Link href="/partner" className="px-6 py-3 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-rose-600 hover:text-rose-600 transition-all">Go to Dashboard</Link>
                  )}
                  <button onClick={handleLogout} className="p-3 bg-white/5 border-2 border-slate-100 rounded-2xl text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all"><LogOut className="w-4 h-4" /></button>
               </div>
            ) : (
              <Link href="/login" className="px-6 py-3 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-rose-600 hover:text-rose-600 transition-all">Login</Link>
            )}
            {selectedTests.length > 0 && (
              <button onClick={() => setIsWizardOpen(true)} className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-200 animate-in fade-in slide-in-from-right">
                Review Cart ({selectedTests.length})
              </button>
            )}
          </div>
        </nav>
      </div>

      <main className="flex-1">
        <section className="section-mask">
          <Hero3DContainer />
        </section>

        <section id="test-directory" className="py-24 md:py-40 bg-slate-50/50">
          <TestSearch 
            tests={tests} 
            selectedIds={selectedTests.map(t => t._id)}
            onSelect={handleTestSelect} 
          />
        </section>

        <section id="clinical-services" className="py-24 px-12 bg-white">
           <div className="max-w-[1440px] mx-auto text-center">
              <h2 className="text-4xl font-black text-slate-900 mb-12">Clinical Excellence</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="p-12 bg-slate-50/70 rounded-[3rem]">
                    <ShieldCheck className="mx-auto text-rose-600 mb-6" size={48} />
                    <h3 className="text-xl font-bold mb-4">NABL Accredited</h3>
                    <p className="text-slate-500">Gold standard pathology reports recognized globally.</p>
                 </div>
                 <div className="p-12 bg-slate-50/70 rounded-[3rem]">
                    <Zap className="mx-auto text-rose-600 mb-6" size={48} />
                    <h3 className="text-xl font-bold mb-4">Fast Results</h3>
                    <p className="text-slate-500">Same-day turnaround for most standard clinical panels.</p>
                 </div>
                 <div className="p-12 bg-slate-50/70 rounded-[3rem]">
                    <Clock className="mx-auto text-rose-600 mb-6" size={48} />
                    <h3 className="text-xl font-bold mb-4">24/7 Support</h3>
                    <p className="text-slate-500">Clinical experts available for result consultation.</p>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <footer id="help-support" className="bg-slate-950 text-white py-24 px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          {/* Left Column: Brand Identity */}
          <div>
            <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
              <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center">
                <FlaskConical className="text-white w-6 h-6" />
              </div>
              <h2 className="font-heading font-black text-2xl text-white tracking-tighter uppercase">PAWAR<span className="text-rose-600">LAB</span></h2>
            </div>
            <p className="text-slate-500 max-w-sm mx-auto md:mx-0">Leading diagnostic intelligence provider in Madhya Pradesh. Precision analysis since 1998.</p>
          </div>

          {/* Center Column: Contact Node */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4">Contact Node</h4>
            <p className="text-slate-400 font-bold mb-2">+91 9755553339</p>
            <p className="text-slate-500">support@pawarlab.com</p>
          </div>

          {/* Right Column: Laboratory Location */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4">Laboratory Location</h4>
            <a 
              href="https://www.google.com/maps/search/?api=1&query=Pawar+Pathology+Lab+Betul" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-2"
            >
              <MapPin size={16} />
              <span>Find us on Google Maps</span>
            </a>
          </div>
        </div>
      </footer>

      {bookingSuccess && (
        <div className="fixed inset-0 z-[101] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] shadow-2xl p-12 text-center max-w-md animate-in fade-in zoom-in-95">
                <CheckCircle className="text-emerald-500 w-24 h-24 mx-auto mb-6" />
                <h2 className="text-3xl font-black text-slate-900 mb-4">Booking Successful!</h2>
                <p className="text-slate-500 mb-8">Your request has been submitted. Our team will contact you shortly to confirm the details.</p>
                <button 
                    onClick={() => {
                      setBookingSuccess(false);
                    }}
                    className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-rose-600 transition-all"
                >
                    Done
                </button>
            </div>
        </div>
      )}

      {isWizardOpen && (
        <BookingWizard 
          selectedTests={selectedTests} 
          onCancel={() => setIsWizardOpen(false)}
          onComplete={handleBookingComplete}
        />
      )}
    </div>
  );
}