

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added useRouter import
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
  const router = useRouter(); // Initialize router hook
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    setCurrentUser(mockApi.getCurrentUser());
    fetchUserBookings();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchUserBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const allBookings = await res.json();
        const user = mockApi.getCurrentUser();
        // Secure filtering based on logged-in identity
        if (user) {
          setUserBookings(allBookings.filter((b: any) => b.email === user.email || b.patientName === user.name));
        } else {
          setUserBookings([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookingComplete = async (formData: any) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tests: selectedTests,
          totalAmount: formData.totalAmount,
          scheduledDate: formData.date,
          paymentStatus: formData.paymentMethod === 'online' ? 'paid' : 'unpaid',
          status: 'pending'
        }),
      });

      if (response.ok) {
        setSelectedTests([]);
        setIsWizardOpen(false);
        fetchUserBookings();
        alert('Diagnostic request registered successfully.');
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
      case 'accepted': return 'Confirmed by Pathologist';
      case 'assigned': return 'Dispatched for Pickup';
      case 'reached': return 'Staff Arrived at Site';
      case 'sample_collected': return 'Specimen in Lab Transit';
      case 'report_uploaded': return 'Reviewing Analysis Results';
      default: return 'Processing Cycle';
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
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
              <FlaskConical className="text-white w-6 h-6" />
            </div>
            <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tighter uppercase">PAWAR<span className="text-rose-600">LAB</span></h2>
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
                Analysis Suite ({selectedTests.length})
              </button>
            )}
          </div>
        </nav>
      </div>

      <main className="flex-1">
        <section className="section-mask">
          <Hero3DContainer />
        </section>

        {currentUser && (
          <section id="portal" className="py-24 px-4 md:px-12 bg-white relative z-30">
            <div className="max-w-[1440px] mx-auto">
              <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-20">
                <div className="max-w-2xl">
                   <span className="text-rose-600 text-[10px] font-black uppercase tracking-[0.5em] mb-4 block">Personal Diagnostic Portal</span>
                   <h2 className="font-heading text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-6">Diagnostic <br />Cycle <span className="text-rose-600">Map</span></h2>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-5 h-5 text-rose-600" />
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Track Active Analysis</h3>
                  </div>
                  <div className="space-y-6">
                    {activeBookings.length === 0 ? (
                      <div className="bg-slate-50 p-16 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                        <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active diagnostic cycles detected.</p>
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
                              <p className="text-lg font-black text-slate-900 tracking-tight">{new Date(b.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Scheduled Date</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4">
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
                                <MapPin className="w-4 h-4 text-rose-500" /> {b.collectionType === CollectionType.HOME ? 'Site Pickup' : 'Lab Visit'}
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified Record
                             </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Verified Reports</h3>
                  </div>
                  <div className="space-y-6">
                    {reports.length === 0 ? (
                      <div className="bg-slate-50 p-16 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                        <FileDown className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Waiting for clinical verification.</p>
                      </div>
                    ) : (
                      reports.map(r => (
                        <div key={r._id} className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 flex items-center justify-between group hover:shadow-2xl hover:shadow-emerald-200/50 transition-all">
                          <div className="flex items-center gap-8">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><FileDown /></div>
                            <div>
                              <p className="font-black text-xl text-emerald-900 tracking-tight">{r.tests[0].title}</p>
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Ready for download</p>
                            </div>
                          </div>
                          <a href={r.reportFileUrl} target="_blank" className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all"><FileDown className="w-6 h-6" /></a>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="directory" className="py-24 md:py-40 bg-slate-50/50">
          <TestSearch tests={MOCK_TESTS} onSelect={test => {
            if (!currentUser) {
              alert("Please login to schedule an investigation.");
              router.push('/login'); // Fix: Navigate using the initialized router hook
              return;
            }
            setSelectedTests(prev => [...prev, test]);
          }} />
        </section>
      </main>

      {/* Modern High-End Footer */}
      <footer className="bg-slate-950 text-white pt-24 md:pt-40 pb-12 md:pb-16 px-4 md:px-12 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-24">
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
              <FlaskConical className="text-rose-600 w-10 h-10 md:w-12 md:h-12" />
              <h2 className="font-heading font-black text-xl md:text-2xl tracking-tighter">PAWAR<span className="text-rose-600">LAB</span></h2>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-medium mb-8 md:mb-12 max-w-xs">
              Defining precision diagnostics through advanced molecular analysis and integrated patient care since 1998.
            </p>
            <div className="flex gap-4">
              {[Instagram, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-rose-600 transition-all group shadow-sm">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 md:gap-10 sm:col-span-2 md:col-span-2">
            <div>
              <h4 className="font-black text-[9px] md:text-[10px] text-slate-500 uppercase tracking-[0.4em] mb-8 md:mb-12">Diagnostic Hub</h4>
              <ul className="space-y-4 md:space-y-5 text-sm font-bold text-slate-400">
                {['Hematology', 'Biochemistry', 'Microbiology', 'Hormone Assay'].map(t => (
                  <li key={t}><a href="#" className="hover:text-rose-500 transition-colors tracking-wide">{t}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[9px] md:text-[10px] text-slate-500 uppercase tracking-[0.4em] mb-8 md:mb-12">Access Node</h4>
              <ul className="space-y-4 md:space-y-5 text-sm font-bold text-slate-400">
                <li><Link href="/login" className="hover:text-rose-500 transition-colors">Administrator OS</Link></li>
                <li><Link href="/login" className="hover:text-rose-500 transition-colors">Partner Dashboard</Link></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="sm:col-span-2 md:col-span-1">
             <div className="glass-dark p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 shadow-2xl">
                <h4 className="font-heading font-bold text-lg md:text-xl mb-6 md:mb-8 tracking-tight">Facility Status</h4>
                <div className="space-y-4 md:space-y-6">
                   <div className="flex justify-between text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      <span>Mon - Sat</span>
                      <span className="text-white">08:00 - 20:00</span>
                   </div>
                   <div className="flex justify-between text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      <span>Sunday</span>
                      <span className="text-white">08:00 - 14:00</span>
                   </div>
                   <div className="pt-4 md:pt-6 flex items-center gap-3 md:gap-4 text-emerald-400 font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em]">
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                      Facility Active
                   </div>
                </div>
             </div>
          </div>
        </div>
        
        <div className="max-w-[1440px] mx-auto border-t border-white/5 mt-16 md:mt-32 pt-10 md:pt-16 flex flex-col md:flex-row justify-between items-center text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] md:tracking-[0.5em] gap-4">
          <span>&copy; {new Date().getFullYear()} Pawar Pathology Lab • Integrated Clinical Systems</span>
          <span className="flex items-center gap-2 md:gap-3">NABL Accredited Excellence <Award className="w-3.5 h-3.5 md:w-4 md:h-4" /></span>
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