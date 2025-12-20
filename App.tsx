
import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Mail, Instagram, Facebook, Clock, FlaskConical, User, ShieldCheck, ChevronRight, Briefcase, Home, LogOut, HeartHandshake, LogIn, Activity, Globe, Award, Zap } from 'lucide-react';
import Hero3D from './components/3D/Hero3D';
import TestSearch from './components/TestSearch';
import BookingWizard from './components/BookingWizard';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import PartnerDashboard from './components/Dashboard/PartnerDashboard';
import { Test, UserRole, User as UserType } from './types';
import { LAB_INFO } from './constants';
import { mockApi } from './lib/mockApi';

const App: React.FC = () => {
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [view, setView] = useState<'home' | 'login' | 'admin' | 'partner'>('home');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const user = mockApi.getCurrentUser();
    if (user) setCurrentUser(user);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mockTests: Test[] = [
    { id: '1', title: 'CBC - Complete Blood Count', category: 'Hematology', price: 350, description: 'High-precision automated cellular analysis measuring 24 vital parameters.', isHomeCollectionAvailable: true, fastingRequired: false },
    { id: '2', title: 'Comprehensive Lipid Panel', category: 'Biochemistry', price: 750, description: 'Evaluation of total cholesterol, HDL, LDL, and VLDL using enzymatic methods.', isHomeCollectionAvailable: true, fastingRequired: true },
    { id: '3', title: 'HbA1c - Glycated Hemoglobin', category: 'Biochemistry', price: 550, description: 'Gold standard for 3-month glycemic control monitoring using HPLC technology.', isHomeCollectionAvailable: true, fastingRequired: false },
    { id: '4', title: 'Thyroid Function (Ultra-Sensitive)', category: 'Hormones', price: 600, description: 'Third-generation CLIA assay for T3, T4, and ultra-sensitive TSH monitoring.', isHomeCollectionAvailable: true, fastingRequired: false },
    { id: '5', title: 'Vitamin B12 (Active)', category: 'Special Tests', price: 1200, description: 'Direct measurement of active cobalamin vital for neuro-muscular health.', isHomeCollectionAvailable: true, fastingRequired: true },
    { id: '6', title: 'Advanced LFT Profile', category: 'Biochemistry', price: 900, description: 'Comprehensive enzymatic and metabolic assessment of hepatic function.', isHomeCollectionAvailable: true, fastingRequired: false },
  ];

  const handleTestSelect = (test: Test) => {
    if (!selectedTests.find(t => t.id === test.id)) setSelectedTests([...selectedTests, test]);
  };

  const handleBookingComplete = (formData: any) => {
    mockApi.saveBooking({
      patientName: formData.name,
      tests: selectedTests,
      totalAmount: selectedTests.reduce((acc, t) => acc + t.price, 0),
      collectionType: formData.collectionType,
      scheduledDate: formData.date
    });
    setSelectedTests([]);
    setIsWizardOpen(false);
    // Real app would use a toast notification here
  };

  const handleLogout = () => {
    mockApi.logout();
    setCurrentUser(null);
    setView('home');
  };

  if (view === 'login') return <LoginPage onLoginSuccess={(u) => { setCurrentUser(u); setView(u.role === UserRole.ADMIN ? 'admin' : 'partner'); }} onBack={() => setView('home')} />;
  if (view === 'admin') return <AdminDashboard onLogout={handleLogout} />;
  if (view === 'partner') return <PartnerDashboard onLogout={handleLogout} />;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFB]">
      {/* Dynamic Nav Island */}
      <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 px-4 md:px-8 ${isScrolled ? 'pt-4' : 'pt-8'}`}>
        <nav className={`max-w-7xl mx-auto glass-pro rounded-[2.5rem] px-8 py-5 flex justify-between items-center shadow-2xl shadow-slate-200/50 transition-all ${isScrolled ? 'py-4' : 'py-6'}`}>
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-12 h-12 bg-rose-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:rotate-6 transition-all duration-500">
              <FlaskConical className="text-white w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h2 className="font-heading font-black text-2xl leading-none tracking-tight text-slate-900">PAWAR<span className="text-rose-600">LAB</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Advanced Diagnostics</p>
            </div>
          </div>

          <div className="hidden md:flex gap-12">
            {['Services', 'Directory', 'Network', 'Support'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-rose-600 transition-colors">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <button 
                onClick={() => setView(currentUser.role === UserRole.ADMIN ? 'admin' : 'partner')}
                className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-slate-200"
              >
                <Activity className="w-4 h-4" /> Management Portal
              </button>
            ) : (
              <button 
                onClick={() => setView('login')}
                className="flex items-center gap-3 px-7 py-3.5 border-2 border-slate-100 rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-slate-500 hover:border-rose-600 hover:text-rose-600 transition-all"
              >
                <LogIn className="w-4 h-4" /> Portal
              </button>
            )}
            
            {selectedTests.length > 0 && (
              <button 
                onClick={() => setIsWizardOpen(true)}
                className="bg-rose-600 text-white px-7 py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-200 flex items-center gap-3 animate-pulse hover:animate-none"
              >
                Checkout <span className="bg-white/20 px-2 py-0.5 rounded-lg">{selectedTests.length}</span>
              </button>
            )}
          </div>
        </nav>
      </div>

      <main className="flex-1">
        <section className="section-mask-bottom">
          <Hero3D />
        </section>

        {/* The Integration Bridge */}
        <section id="services" className="relative z-30 -mt-32 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Award, title: "NABL Accredited", desc: "Rigorous quality control matching international clinical standards.", color: "rose" },
                { icon: Zap, title: "Next-Day Results", desc: "Advanced molecular processing for industry-leading turnaround times.", color: "blue" },
                { icon: Globe, title: "Global Logistics", desc: "Temperature-controlled specimen transport across all networks.", color: "emerald" }
              ].map((item, idx) => (
                <div key={idx} className="glass-pro p-10 rounded-[3rem] shadow-2xl shadow-slate-200/40 hover:-translate-y-2 transition-all duration-500 group">
                  <div className={`w-16 h-16 rounded-2xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-heading text-2xl font-black text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="directory" className="py-32">
          <TestSearch tests={mockTests} onSelect={handleTestSelect} />
        </section>

        {/* Location Section */}
        <section className="py-32 px-4 md:px-8 bg-slate-900 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <Hero3D /> {/* Reusing the component as a background element */}
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
            <div>
              <span className="text-rose-500 font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">Clinical Center</span>
              <h2 className="font-heading text-5xl font-black text-white tracking-tighter mb-8 leading-none">
                Betul's Flagship <br /> <span className="text-rose-500">Diagnostic Hub</span>
              </h2>
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <MapPin className="text-rose-500 w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-2">Primary Center</h4>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">{LAB_INFO.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Phone className="text-rose-500 w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">Direct Helpline</h4>
                    <p className="text-slate-400 font-medium">+91 {LAB_INFO.contact}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="glass-dark p-2 rounded-[3.5rem] shadow-3xl">
              <div className="bg-slate-800 h-[400px] rounded-[3rem] relative flex items-center justify-center overflow-hidden">
                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Dynamic Map Interface</p>
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Luxury Footer */}
      <footer className="bg-slate-950 text-white pt-32 pb-16 px-4 md:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-4 mb-10">
              <FlaskConical className="text-rose-600 w-10 h-10" />
              <h2 className="font-heading font-black text-2xl tracking-tighter">PAWAR<span className="text-rose-600">LAB</span></h2>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-medium mb-10">
              Defining the future of diagnostics through precision molecular analysis and exceptional patient care since 1998.
            </p>
            <div className="flex gap-4">
              {[Instagram, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-rose-600 transition-all group">
                  <Icon className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </a>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-10 md:col-span-2">
            <div>
              <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-[0.3em] mb-10">Directory</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                {['Hematology', 'Biochemistry', 'Clinical Trials', 'Hormonal Assay'].map(t => (
                  <li key={t}><a href="#" className="hover:text-rose-500 transition-colors">{t}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[10px] text-slate-500 uppercase tracking-[0.3em] mb-10">Access</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                <li><button onClick={() => setView('login')} className="hover:text-rose-500 transition-colors">Staff Portal</button></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">Partner Dashboard</a></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">MD Consultation</a></li>
              </ul>
            </div>
          </div>

          <div>
             <div className="glass-dark p-8 rounded-[2.5rem] border border-white/5">
                <h4 className="font-heading font-bold text-xl mb-6">Operating Status</h4>
                <div className="space-y-5">
                   <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Mon - Sat</span>
                      <span className="text-white">08:00 - 20:00</span>
                   </div>
                   <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <span>Sunday</span>
                      <span className="text-white">08:00 - 14:00</span>
                   </div>
                   <div className="pt-4 flex items-center gap-3 text-emerald-400 font-black uppercase text-[10px] tracking-widest">
                      <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
                      Facility Active
                   </div>
                </div>
             </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-32 pt-12 flex flex-col md:flex-row justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">
          <span>&copy; {new Date().getFullYear()} Pawar Lab • Integrated Solutions</span>
          <span className="flex items-center gap-2">Built for Excellence <Award className="w-3 h-3" /></span>
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
