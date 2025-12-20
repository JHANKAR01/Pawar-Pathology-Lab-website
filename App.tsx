import React, { useState, useEffect } from 'react';
import { 
  Phone, MapPin, FlaskConical, LogOut, Activity, 
  Award, Zap, Globe, ShieldCheck, ChevronRight, Instagram, Facebook,
  Clock, HeartHandshake, User as UserIcon, CheckCircle
} from 'lucide-react';
import Hero3D from './components/3D/Hero3D';
import TestSearch from './components/TestSearch';
import BookingWizard from './components/BookingWizard';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import PartnerDashboard from './components/Dashboard/PartnerDashboard';
import { Test, UserRole, User as UserType } from './types';
import { mockApi } from './lib/mockApi';

const App: React.FC = () => {
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [view, setView] = useState<'home' | 'login' | 'admin' | 'partner'>('home');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    
    // Auto-login if session exists
    const user = mockApi.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === UserRole.ADMIN) setView('admin');
      else if (user.role === UserRole.PARTNER) setView('partner');
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mockTests: Test[] = [
    { id: '1', title: 'CBC - Hematology Profile', category: 'Hematology', price: 350, description: 'High-precision automated cellular analysis of 24 vital blood parameters.', isHomeCollectionAvailable: true, fastingRequired: false },
    { id: '2', title: 'Lipid Management Panel', category: 'Biochemistry', price: 750, description: 'Evaluation of total cholesterol, HDL, LDL, and VLDL using enzymatic methods.', isHomeCollectionAvailable: true, fastingRequired: true },
    { id: '3', title: 'HbA1c - Glycemic Control', category: 'Biochemistry', price: 550, description: '3-month glycemic control monitoring using HPLC technology.', isHomeCollectionAvailable: true, fastingRequired: false },
    { id: '4', title: 'Thyroid Ultra-Sensitive Profile', category: 'Hormones', price: 600, description: 'Third-generation CLIA assay for T3, T4, and ultra-sensitive TSH.', isHomeCollectionAvailable: true, fastingRequired: false },
    { id: '5', title: 'Vitamin B12 Assay', category: 'Special Tests', price: 1200, description: 'Direct measurement of active cobalamin for neuro-metabolic health.', isHomeCollectionAvailable: true, fastingRequired: true },
  ];

  const handleTestSelect = (test: Test) => {
    if (!currentUser) {
      setView('login');
      return;
    }
    if (selectedTests.find(t => t.id === test.id)) {
      setSelectedTests(prev => prev.filter(t => t.id !== test.id));
    } else {
      setSelectedTests(prev => [...prev, test]);
    }
  };

  const handleLogout = () => {
    mockApi.logout();
    setCurrentUser(null);
    setView('home');
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = (u: UserType) => {
    setCurrentUser(u);
    if (u.role === UserRole.ADMIN) setView('admin');
    else if (u.role === UserRole.PARTNER) setView('partner');
    else setView('home');
  };

  const handleBookingComplete = (formData: any) => {
    mockApi.saveBooking({ 
      ...formData, 
      tests: selectedTests, 
      status: 'pending' as any 
    });
    setSelectedTests([]);
    setIsWizardOpen(false);
    alert('Investigation scheduled successfully. Awaiting center approval.');
  };

  if (view === 'login') return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setView('home')} />;
  if (view === 'admin') return <AdminDashboard onLogout={handleLogout} />;
  if (view === 'partner') return <PartnerDashboard onLogout={handleLogout} />;

  return (
    <div className="flex flex-col min-h-screen selection:bg-rose-100 selection:text-rose-600">
      <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 px-4 md:px-12 ${isScrolled ? 'pt-2 md:pt-4' : 'pt-4 md:pt-8'}`}>
        <nav className={`max-w-[1440px] mx-auto glass-pro rounded-[1.5rem] md:rounded-[2.5rem] px-4 md:px-8 py-3 flex justify-between items-center shadow-2xl transition-all ${isScrolled ? 'py-3' : 'py-5'}`}>
          <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-all duration-500">
              <FlaskConical className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h2 className="font-heading font-black text-lg md:text-2xl leading-none tracking-tight text-slate-900 uppercase">PAWAR<span className="text-rose-600">LAB</span></h2>
          </div>

          <div className="hidden lg:flex gap-14">
            {['Directory', 'Services', 'Support'].map(item => (
              <button 
                key={item} 
                onClick={() => {
                   const el = document.getElementById(item.toLowerCase());
                   el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-rose-600 transition-all"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {currentUser ? (
               <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-[10px] font-black uppercase text-slate-400 tracking-widest">Hi, {currentUser.name}</span>
                  <button onClick={handleLogout} className="p-3 border-2 border-slate-100 rounded-xl text-slate-500 hover:text-rose-600 transition-all"><LogOut className="w-4 h-4" /></button>
               </div>
            ) : (
              <button onClick={() => setView('login')} className="px-6 py-3 border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-rose-600 hover:text-rose-600 transition-all">Login</button>
            )}
            
            {selectedTests.length > 0 && (
              <button onClick={() => setIsWizardOpen(true)} className="bg-rose-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3">
                Review <span className="bg-white/20 px-2 py-0.5 rounded-lg">{selectedTests.length}</span>
              </button>
            )}
          </div>
        </nav>
      </div>

      <main className="flex-1">
        <section className="section-mask">
          <Hero3D />
        </section>

        <section id="services" className="relative z-30 -mt-12 md:-mt-24 px-4 md:px-12">
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Award, title: "NABL Accredited", desc: "Rigorous quality matching global clinical standards for precision reporting.", color: "rose" },
              { icon: Zap, title: "Molecular Speed", desc: "Proprietary processing ensures results within the shortest clinical window.", color: "blue" },
              { icon: Globe, title: "Global Network", desc: "Integrated specimen logistics and digital report access for all patients.", color: "emerald" }
            ].map((item, idx) => (
              <div key={idx} className="glass-pro p-10 rounded-[3rem] shadow-xl hover:-translate-y-2 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-sm text-rose-600"><item.icon size={28} /></div>
                <h3 className="text-xl font-black text-slate-900 mb-4">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="directory" className="py-24 md:py-40 bg-white/40">
          <TestSearch tests={mockTests} onSelect={handleTestSelect} selectedIds={selectedTests.map(t => t.id)} />
        </section>
      </main>

      <footer id="support" className="bg-slate-950 text-white py-24 px-12">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">PAWAR<span className="text-rose-600">LAB</span></h2>
            <p className="text-slate-500 max-w-sm">Leading diagnostic intelligence provider in Betul, Madhya Pradesh. Precision analysis since 1998.</p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-8">Clinical Contact</h4>
            <p className="text-slate-400 font-bold mb-2">+91 9755553339</p>
            <p className="text-slate-500">support@pawarlab.com</p>
          </div>
          <div>
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
};

export default App;