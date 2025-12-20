'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Phone, MapPin, FlaskConical, LogIn, Activity, 
  Award, Zap, Globe, Instagram, Facebook, Clock, 
  CheckCircle, FileDown, LayoutDashboard, ChevronRight,
  ClipboardList, Navigation, ShieldCheck, UserCheck, LogOut
} from 'lucide-react';
import Hero3DContainer from '@/components/3D/Hero3DContainer';
import TestSearch from '@/components/TestSearch';
import BookingWizard from '@/components/BookingWizard';
import { Test, CollectionType, BookingStatus } from '@/types';
import { mockApi } from '@/lib/mockApi';

const MOCK_TESTS: Test[] = [
  { id: '1', title: 'CBC - Hematology Profile', category: 'Hematology', price: 350, description: 'High-precision automated cellular analysis of 24 vital blood parameters.', isHomeCollectionAvailable: true, fastingRequired: false },
  { id: '2', title: 'Lipid Management Panel', category: 'Biochemistry', price: 750, description: 'Evaluation of total cholesterol, HDL, LDL, and VLDL using enzymatic methods.', isHomeCollectionAvailable: true, fastingRequired: true },
  { id: '3', title: 'HbA1c - Glycemic Control', category: 'Biochemistry', price: 550, description: '3-month glycemic control monitoring using HPLC technology.', isHomeCollectionAvailable: true, fastingRequired: false },
  { id: '4', title: 'Thyroid Ultra-Sensitive Profile', category: 'Hormones', price: 600, description: 'Third-generation CLIA assay for T3, T4, and ultra-sensitive TSH.', isHomeCollectionAvailable: true, fastingRequired: false },
  { id: '5', title: 'Vitamin B12 Assay', category: 'Special Tests', price: 1200, description: 'Direct measurement of active cobalamin for neuro-metabolic health.', isHomeCollectionAvailable: true, fastingRequired: true },
];

export default function Home() {
  const router = useRouter();
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    setCurrentUser(mockApi.getCurrentUser());
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBookingComplete = async (formData: any) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tests: selectedTests,
          status: 'pending',
          bookedByEmail: currentUser?.email || 'guest'
        }),
      });

      if (response.ok) {
        setSelectedTests([]);
        setIsWizardOpen(false);
        alert('Booking request sent for approval.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Booking failed', error);
    }
  };

  const handleTestSelect = (test: Test) => {
    if (!currentUser) {
      alert("Please login to schedule investigations.");
      router.push('/login');
      return;
    }
    if (selectedTests.find(t => t.id === test.id)) {
      // Logic for deselecting if needed, but UI now disables button
      setSelectedTests(prev => prev.filter(t => t.id !== test.id));
    } else {
      setSelectedTests(prev => [...prev, test]);
    }
  };

  const handleLogout = () => {
    mockApi.logout();
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 px-4 md:px-12 ${isScrolled ? 'pt-2 md:pt-4' : 'pt-4 md:pt-8'}`}>
        <nav className={`max-w-[1440px] mx-auto glass-pro rounded-[1.5rem] md:rounded-[2.5rem] px-4 md:px-8 py-3 flex justify-between items-center shadow-2xl transition-all ${isScrolled ? 'py-3' : 'py-5'}`}>
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center">
              <FlaskConical className="text-white w-6 h-6" />
            </div>
            <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tighter uppercase">PAWAR<span className="text-rose-600">LAB</span></h2>
          </div>

          <div className="hidden lg:flex gap-14">
            {['Directory', 'Services', 'Network', 'Support'].map(item => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-rose-600 transition-all"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
               <div className="flex items-center gap-4">
                  <span className="hidden md:block text-xs font-black uppercase text-slate-400">Hi, {currentUser.name}</span>
                  <button onClick={handleLogout} className="p-3 border-2 border-slate-100 rounded-2xl text-slate-500 hover:text-rose-600 transition-all"><LogOut className="w-4 h-4" /></button>
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

        <section id="directory" className="py-24 md:py-40 bg-slate-50/50">
          <TestSearch 
            tests={MOCK_TESTS} 
            selectedIds={selectedTests.map(t => t.id)}
            onSelect={handleTestSelect} 
          />
        </section>

        <section id="services" className="py-24 px-12 bg-white">
           <div className="max-w-[1440px] mx-auto text-center">
              <h2 className="text-4xl font-black text-slate-900 mb-12">Clinical Excellence</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="p-12 glass-pro rounded-[3rem]">
                    <ShieldCheck className="mx-auto text-rose-600 mb-6" size={48} />
                    <h3 className="text-xl font-bold mb-4">NABL Accredited</h3>
                    <p className="text-slate-500">Gold standard pathology reports recognized globally.</p>
                 </div>
                 <div className="p-12 glass-pro rounded-[3rem]">
                    <Zap className="mx-auto text-rose-600 mb-6" size={48} />
                    <h3 className="text-xl font-bold mb-4">Fast Results</h3>
                    <p className="text-slate-500">Same-day turnaround for most standard clinical panels.</p>
                 </div>
                 <div className="p-12 glass-pro rounded-[3rem]">
                    <Clock className="mx-auto text-rose-600 mb-6" size={48} />
                    <h3 className="text-xl font-bold mb-4">24/7 Support</h3>
                    <p className="text-slate-500">Clinical experts available for result consultation.</p>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <footer id="support" className="bg-slate-950 text-white py-24 px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-black mb-8 uppercase">PAWAR<span className="text-rose-600">LAB</span></h2>
            <p className="text-slate-500 max-w-sm">Leading diagnostic intelligence provider in Madhya Pradesh. Precision analysis since 1998.</p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-8">Contact Node</h4>
            <p className="text-slate-400 font-bold mb-2">+91 9755553339</p>
            <p className="text-slate-500">support@pawarlab.com</p>
          </div>
          <div id="network">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-8">Location Node</h4>
            <p className="text-slate-500">Link Road, Tikari, Betul (MP)</p>
          </div>
        </div>
      </footer>

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