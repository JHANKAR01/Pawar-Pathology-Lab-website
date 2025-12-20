'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Phone, MapPin, FlaskConical, LogIn, Activity, 
  Award, Zap, Globe, Instagram, Facebook, Clock, 
  CheckCircle, FileDown, LayoutDashboard, ChevronRight,
  ClipboardList, Navigation, ShieldCheck, UserCheck
} from 'lucide-react';
import Hero3DContainer from '@/components/3D/Hero3DContainer';
import TestSearch from '@/components/TestSearch';
import BookingWizard from '@/components/BookingWizard';
import { Test, CollectionType, BookingStatus } from '@/types';
import { LAB_INFO } from '@/constants';

const MOCK_TESTS: Test[] = [
  { id: '1', title: 'CBC - Hematology Profile', category: 'Hematology', price: 350, description: 'High-precision automated cellular analysis of 24 vital blood parameters.', isHomeCollectionAvailable: true, fastingRequired: false },
  { id: '2', title: 'Lipid Management Panel', category: 'Biochemistry', price: 750, description: 'Evaluation of total cholesterol, HDL, LDL, and VLDL using enzymatic methods.', isHomeCollectionAvailable: true, fastingRequired: true },
  { id: '3', title: 'HbA1c - Glycemic Control', category: 'Biochemistry', price: 550, description: '3-month glycemic control monitoring using HPLC technology.', isHomeCollectionAvailable: true, fastingRequired: false },
  { id: '4', title: 'Thyroid Ultra-Sensitive Profile', category: 'Hormones', price: 600, description: 'Third-generation CLIA assay for T3, T4, and ultra-sensitive TSH.', isHomeCollectionAvailable: true, fastingRequired: false },
  { id: '5', title: 'Vitamin B12 Assay', category: 'Special Tests', price: 1200, description: 'Direct measurement of active cobalamin for neuro-metabolic health.', isHomeCollectionAvailable: true, fastingRequired: true },
];

export default function Home() {
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    fetchUserBookings();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchUserBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) setUserBookings(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestSelect = (test: Test) => {
    if (!selectedTests.find(t => t.id === test.id)) setSelectedTests([...selectedTests, test]);
  };

  const handleBookingComplete = async (formData: any) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: formData.name,
          tests: selectedTests,
          totalAmount: selectedTests.reduce((acc, t) => acc + t.price, 0),
          collectionType: formData.collectionType,
          address: formData.address,
          coordinates: formData.coordinates,
          scheduledDate: formData.date,
          paymentMode: formData.paymentMethod,
          paymentStatus: formData.paymentMethod === 'online' ? 'paid' : 'unpaid'
        }),
      });

      if (response.ok) {
        setSelectedTests([]);
        setIsWizardOpen(false);
        fetchUserBookings();
        alert('Clinical Booking Registered Successfully. Follow the progress in your dashboard below.');
      }
    } catch (error) {
      console.error('Booking failed', error);
    }
  };

  const activeBookings = userBookings.filter(b => b.status !== 'completed');
  const reports = userBookings.filter(b => b.status === 'completed' && b.reportFileUrl);

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return 'Lab Verification Pending';
      case 'accepted': return 'Accepted by Pathologist';
      case 'assigned': return 'Dispatched for Pickup';
      case 'reached': return 'Staff Arrived at Site';
      case 'sample_collected': return 'Specimen Acquired';
      case 'report_uploaded': return 'Final Verification Queue';
      default: return status.toUpperCase();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 px-4 md:px-12 ${isScrolled ? 'pt-2 md:pt-4' : 'pt-4 md:pt-8'}`}>
        <nav className={`max-w-[1440px] mx-auto glass-pro rounded-[1.5rem] md:rounded-[2.5rem] px-4 md:px-8 py-3 flex justify-between items-center shadow-2xl transition-all ${isScrolled ? 'py-3' : 'py-5'}`}>
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
              <FlaskConical className="text-white w-6 h-6" />
            </div>
            <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tighter uppercase">PAWAR<span className="text-rose-600">LAB</span></h2>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="px-6 py-3 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-rose-600 hover:text-rose-600 transition-all">Login</Link>
            {selectedTests.length > 0 && (
              <button onClick={() => setIsWizardOpen(true)} className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-200 animate-in fade-in slide-in-from-right">
                Analysis Cart ({selectedTests.length})
              </button>
            )}
          </div>
        </nav>
      </div>

      <main className="flex-1">
        <section className="section-mask">
          <Hero3DContainer />
        </section>

        {/* Patient Personal Node */}
        <section id="portal" className="py-24 px-4 md:px-12 bg-white relative z-30">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-20">
              <div className="max-w-2xl">
                 <span className="text-rose-600 text-[10px] font-black uppercase tracking-[0.5em] mb-4 block">Patient Intelligence Portal</span>
                 <h2 className="font-heading text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-6">Diagnostic <br />Cycle <span className="text-rose-600">Control</span></h2>
                 <p className="text-slate-500 text-lg font-medium leading-relaxed">Real-time tracking of clinical specimen acquisition and validated reporting cycles.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900"><Clock className="w-5 h-5" /></div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Live Progress Map</h3>
                </div>
                <div className="space-y-6">
                  {activeBookings.length === 0 ? (
                    <div className="bg-slate-50 p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                      <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No active diagnostic cycles detected.</p>
                    </div>
                  ) : (
                    activeBookings.map(b => (
                      <div key={b._id} className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-50 group hover:border-rose-600/20 transition-all">
                        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 border-b border-slate-100 pb-8">
                          <div>
                            <p className="font-black text-2xl text-slate-900 tracking-tight">{b.tests[0].title}</p>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-2 bg-rose-50 px-3 py-1 rounded-full inline-block">{getStatusLabel(b.status)}</p>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Target Date</p>
                            <p className="text-lg font-black text-slate-900 tracking-tight">{new Date(b.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
                              <MapPin className="w-4 h-4 text-rose-500" /> {b.collectionType === CollectionType.HOME ? 'Site Pickup' : 'Lab Visit'}
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Validating Node
                           </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><CheckCircle className="w-5 h-5" /></div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Verified Results</h3>
                </div>
                <div className="space-y-6">
                  {reports.length === 0 ? (
                    <div className="bg-slate-50 p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                      <FileDown className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Waiting for clinical verification.</p>
                    </div>
                  ) : (
                    reports.map(r => (
                      <div key={r._id} className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100 flex items-center justify-between group hover:shadow-2xl hover:shadow-emerald-200/50 transition-all">
                        <div className="flex items-center gap-8">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform"><FileDown /></div>
                          <div>
                            <p className="font-black text-2xl text-emerald-900 tracking-tight">{r.tests[0].title}</p>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-2">Verified Pathology Report</p>
                          </div>
                        </div>
                        <a 
                          href={r.reportFileUrl} 
                          target="_blank" 
                          className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-110 transition-all"
                        >
                          <FileDown className="w-7 h-7" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="directory" className="py-24 md:py-40 bg-slate-50/50">
          <TestSearch tests={MOCK_TESTS} onSelect={handleTestSelect} />
        </section>
      </main>

      <footer className="bg-slate-950 text-white pt-32 pb-16 px-4 md:px-12 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto text-center">
          <div className="flex justify-center mb-12">
            <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-900/50">
              <FlaskConical className="text-white w-8 h-8" />
            </div>
          </div>
          <h2 className="font-heading font-black text-4xl md:text-5xl mb-8 tracking-tighter">Pioneering Clinical <span className="text-rose-600">Intelligence</span></h2>
          <p className="text-slate-500 max-w-2xl mx-auto mb-16 text-lg font-medium leading-relaxed">Defining diagnostic standards across Betul with high-throughput molecular analysis and NABL-certified precision.</p>
          <div className="flex justify-center gap-6 mb-20">
             <a href="#" className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-rose-600 transition-all shadow-xl"><Instagram className="text-slate-400" /></a>
             <a href="#" className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-rose-600 transition-all shadow-xl"><Facebook className="text-slate-400" /></a>
          </div>
          <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] gap-6">
            <span>&copy; {new Date().getFullYear()} Pawar Pathology Lab • Betul Hub</span>
            <span className="flex items-center gap-3">NABL Accredited Facility <Award className="w-4 h-4 text-rose-600" /></span>
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