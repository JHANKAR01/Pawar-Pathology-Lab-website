'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
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
  loading: () => <div className="relative h-[90vh] md:h-screen w-full overflow-hidden bg-[#020203]" />
});

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && (session as any)?.needsProfileCompletion) {
      router.push('/complete-profile');
    }
  }, [session, status, router]);

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
    const userJson = localStorage.getItem('pawar_lab_user');
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
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
    localStorage.removeItem('pawar_lab_user');
    localStorage.removeItem('pawar_lab_user_role');
    document.cookie = "pawar_lab_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    setCurrentUser(null);
    router.push('/login');
  };
  
  const navItems = ['Test Directory', 'Clinical Services', 'Help & Support'];

  return (
    <div className="flex flex-col min-h-screen">
      <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 px-4 md:px-12 ${isScrolled ? 'pt-2 md:pt-4' : 'pt-4 md:pt-8'}`}>
        <header className={`max-w-[1440px] mx-auto glass-pro rounded-2xl md:rounded-3xl px-6 md:px-10 py-4 flex justify-between items-center shadow-medium transition-all ${isScrolled ? 'py-3 shadow-large' : 'py-4'}`}>
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-14 h-14 bg-clinical-rose rounded-2xl flex items-center justify-center shadow-rose">
              <FlaskConical className="text-white w-7 h-7" />
            </div>
            <h2 className="font-heading font-black text-2xl md:text-3xl text-slate-900 tracking-tighter uppercase">PAWAR<span className="text-clinical-rose">LAB</span></h2>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {navItems.map(item => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="text-sm font-bold uppercase tracking-wider text-slate-600 hover:text-clinical-rose transition-all"
              >
                {item}
              </a>
            ))}
            {currentUser?.role === 'patient' && (
              <Link href="/reports" className="text-sm font-bold uppercase tracking-wider text-clinical-rose hover:text-clinical-rose-dark transition-all">My Reports</Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
               <div className="flex items-center gap-4">
                  <span className="hidden md:block text-sm font-bold text-slate-600">Hi, {currentUser.name}</span>
                  {currentUser.role === 'admin' && (
                    <Link href="/admin" className="px-6 py-3 border-2 border-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-700 hover:border-clinical-rose hover:text-clinical-rose transition-all">Dashboard</Link>
                  )}
                  {currentUser.role === 'partner' && (
                    <Link href="/partner" className="px-6 py-3 border-2 border-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-700 hover:border-clinical-rose hover:text-clinical-rose transition-all">Dashboard</Link>
                  )}
                  <button onClick={handleLogout} className="p-3 bg-slate-100 border-2 border-slate-200 rounded-xl text-slate-600 hover:text-clinical-rose hover:border-clinical-rose transition-all"><LogOut className="w-5 h-5" /></button>
               </div>
            ) : (
              <Link href="/login" className="px-6 py-3 border-2 border-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-700 hover:border-clinical-rose hover:text-clinical-rose transition-all">Login</Link>
            )}
            {selectedTests.length > 0 && (
              <button onClick={() => setIsWizardOpen(true)} className="bg-clinical-rose text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-rose-lg hover:shadow-rose-lg animate-in fade-in slide-in-from-right">
                Review Cart ({selectedTests.length})
              </button>
            )}
          </div>
        </header>
      </div>

      <main className="flex-1 bg-white">
        <section className="section-mask relative h-[90vh] md:h-screen w-full overflow-hidden bg-gradient-to-br from-white via-slate-50 to-rose-50/30">
          <Hero3DContainer />
        </section>

        <section id="test-directory" className="py-24 md:py-40">
          <TestSearch 
            tests={tests} 
            selectedIds={selectedTests.map(t => t._id)}
            onSelect={handleTestSelect} 
          />
        </section>

        <section id="clinical-services" className="py-32 px-12 bg-gradient-to-b from-white to-slate-50">
           <div className="max-w-[1440px] mx-auto text-center">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">Clinical Excellence</h2>
              <p className="text-slate-600 text-lg mb-16 max-w-2xl mx-auto">Trusted by thousands for precision diagnostics and exceptional care</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <motion.div 
                   className="card-premium p-12"
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.5, delay: 0.1 }}
                 >
                    <div className="w-20 h-20 bg-clinical-rose-light rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck className="text-clinical-rose" size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">NABL Accredited</h3>
                    <p className="text-slate-600 leading-relaxed">Gold standard pathology reports recognized globally.</p>
                 </motion.div>
                 <motion.div 
                   className="card-premium p-12"
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.5, delay: 0.2 }}
                 >
                    <div className="w-20 h-20 bg-clinical-rose-light rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Zap className="text-clinical-rose" size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">Fast Results</h3>
                    <p className="text-slate-600 leading-relaxed">Same-day turnaround for most standard clinical panels.</p>
                 </motion.div>
                 <motion.div 
                   className="card-premium p-12"
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ duration: 0.5, delay: 0.3 }}
                 >
                    <div className="w-20 h-20 bg-clinical-rose-light rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Clock className="text-clinical-rose" size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-4">24/7 Support</h3>
                    <p className="text-slate-600 leading-relaxed">Clinical experts available for result consultation.</p>
                 </motion.div>
              </div>
           </div>
        </section>
      </main>

      <footer id="help-support" className="bg-slate-900 text-white py-24 px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          {/* Left Column: Brand Identity */}
          <div>
            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
              <div className="w-14 h-14 bg-clinical-rose rounded-2xl flex items-center justify-center shadow-rose">
                <FlaskConical className="text-white w-7 h-7" />
              </div>
              <h2 className="font-heading font-black text-2xl md:text-3xl text-white tracking-tighter uppercase">PAWAR<span className="text-clinical-rose">LAB</span></h2>
            </div>
            <p className="text-slate-400 max-w-sm mx-auto md:mx-0 leading-relaxed">Leading diagnostic intelligence provider in Madhya Pradesh. Precision analysis since 1998.</p>
          </div>

          {/* Center Column: Contact Node */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Contact Node</h4>
            <p className="text-white font-bold text-lg mb-2">+91 9755553339</p>
            <p className="text-slate-400">support@pawarlab.com</p>
          </div>

          {/* Right Column: Laboratory Location */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Laboratory Location</h4>
            <a 
              href="https://www.google.com/maps/search/?api=1&query=Pawar+Pathology+Lab+Betul" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-slate-300 hover:text-clinical-rose transition-colors flex items-center gap-2 font-medium"
            >
              <MapPin size={18} />
              <span>Find us on Google Maps</span>
            </a>
          </div>
        </div>
      </footer>

      {bookingSuccess && (
        <div className="fixed inset-0 z-[101] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-md animate-in fade-in zoom-in-95 border border-slate-200">
                <CheckCircle className="text-success w-24 h-24 mx-auto mb-6" />
                <h2 className="text-3xl font-black text-slate-900 mb-4">Booking Successful!</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">Your request has been submitted. Our team will contact you shortly to confirm the details.</p>
                <button 
                    onClick={() => {
                      setBookingSuccess(false);
                    }}
                    className="bg-clinical-rose text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-rose-lg hover:bg-clinical-rose-dark transition-all"
                >
                    Done
                </button>
            </div>
        </div>
      )}

      {isWizardOpen && (
        <BookingWizard 
          selectedTests={selectedTests} 
          onTestRemove={handleTestSelect}
          onCancel={() => setIsWizardOpen(false)}
          onComplete={handleBookingComplete}
        />
      )}
    </div>
  );
}