import React, { useState, useEffect } from 'react';
import { 
  Phone, MapPin, FlaskConical, LogOut, LogIn, Activity, 
  Award, Zap, Globe, ShieldCheck, ChevronRight, Instagram, Facebook,
  Clock, HeartHandshake, User as UserIcon
} from 'lucide-react';
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
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    const user = mockApi.getCurrentUser();
    if (user) {
      setCurrentUser(user);
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
    if (!selectedTests.find(t => t.id === test.id)) setSelectedTests([...selectedTests, test]);
  };

  const handleLogout = () => {
    mockApi.logout();
    setCurrentUser(null);
    setView('home');
  };

  const handleLoginSuccess = (u: UserType) => {
    setCurrentUser(u);
    if (u.role === UserRole.ADMIN) {
      setView('admin');
    } else if (u.role === UserRole.PARTNER) {
      setView('partner');
    } else {
      setView('home'); 
    }
  };

  if (view === 'login') return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setView('home')} />;
  if (view === 'admin') return <AdminDashboard onLogout={handleLogout} />;
  if (view === 'partner') return <PartnerDashboard onLogout={handleLogout} />;

  return (
    <div className="flex flex-col min-h-screen selection:bg-rose-100 selection:text-rose-600">
      <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 px-4 md:px-12 ${isScrolled ? 'pt-2 md:pt-4' : 'pt-4 md:pt-8'}`}>
        <nav className={`max-w-[1440px] mx-auto glass-pro rounded-[1.5rem] md:rounded-[2.5rem] px-4 md:px-8 py-3 flex justify-between items-center shadow-2xl shadow-slate-200/50 transition-all ${isScrolled ? 'py-2.5 md:py-3.5 shadow-slate-300/60' : 'py-4 md:py-6'}`}>
          <div className="flex items-center gap-3 md:gap-4 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-600 rounded-[1rem] md:rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-rose-500/30 group-hover:rotate-6 transition-all duration-500">
              <FlaskConical className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="block">
              <h2 className="font-heading font-black text-lg md:text-2xl leading-none tracking-tight text-slate-900 uppercase">PAWAR<span className="text-rose-600">LAB</span></h2>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1 hidden sm:block">Diagnostic Intelligence</p>
            </div>
          </div>

          <div className="hidden lg:flex gap-14">
            {['Directory', 'Services', 'Network', 'Support'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 hover:text-rose-600 transition-all">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.PARTNER) && (
                  <button 
                    onClick={() => setView(currentUser.role === UserRole.ADMIN ? 'admin' : 'partner')}
                    className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-slate-900 text-white rounded-[1rem] md:rounded-[1.4rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-slate-200"
                  >
                    <Activity className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Workstation</span>
                  </button>
                )}
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 border border-slate-200 text-slate-500 rounded-[1rem] md:rounded-[1.4rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setView('login')}
                className="flex items-center gap-2 md:gap-3 px-4 md:px-7 py-2 md:py-3.5 border-2 border-slate-100 rounded-[1rem] md:rounded-[1.4rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-rose-600 hover:text-rose-600 transition-all"
              >
                <LogIn className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span className="hidden sm:inline">Login</span>
              </button>
            )}
            
            {selectedTests.length > 0 && (
              <button 
                onClick={() => setIsWizardOpen(true)}
                className="bg-rose-600 text-white px-4 md:px-7 py-2 md:py-3.5 rounded-[1rem] md:rounded-[1.4rem] font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-rose-300 flex items-center gap-2 md:gap-3 animate-in slide-in-from-right"
              >
                Book <span className="bg-white/20 px-1.5 md:px-2 py-0.5 rounded-lg font-bold">{selectedTests.length}</span>
              </button>
            )}
          </div>
        </nav>
      </div>

      <main className="flex-1">
        <section className="section-mask">
          <Hero3D />
        </section>

        {/* 
            LAYOUT ADJUSTMENT:
            Reduced negative margin from -mt-24 to -mt-8 on desktop to avoid overlap with hero buttons 
        */}
        <section id="services" className="relative z-30 -mt-8 md:-mt-8 px-4 md:px-12">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                { icon: Award, title: "NABL Accredited", desc: "Rigorous quality protocols matching global clinical standards for precision diagnostic reporting.", color: "rose" },
                { icon: Zap, title: "Molecular Speed", desc: "Proprietary high-throughput processing ensures result delivery within the shortest clinical window.", color: "blue" },
                { icon: Globe, title: "Global Network", desc: "Integrated specimen logistics and digital report access for a seamless patient experience.", color: "emerald" }
              ].map((item, idx) => (
                <div key={idx} className="glass-pro p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] shadow-xl hover:-translate-y-2 transition-all duration-500 group border border-white/50">
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                    <item.icon className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="font-heading text-xl md:text-2xl font-black text-slate-900 mb-3 md:mb-4">{item.title}</h3>
                  <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="directory" className="py-24 md:py-40 bg-white/40">
          <TestSearch tests={mockTests} onSelect={handleTestSelect} />
        </section>

        <section id="network" className="py-24 md:py-40 px-4 md:px-12 bg-slate-950 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(225,29,72,0.08),transparent_70%)]" />
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-32 items-center relative z-10">
            <div>
              <span className="text-rose-500 font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-[9px] md:text-[10px] mb-6 md:mb-8 block">Regional Diagnostic Node</span>
              <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter mb-8 md:mb-10 leading-[1] md:leading-[0.9]">
                Pawar Lab <br /> <span className="text-rose-500">Flagship Facility</span>
              </h2>
              <div className="space-y-8 md:space-y-12">
                <div className="flex items-start gap-6 md:gap-8 group">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1.2rem] md:rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-rose-600 transition-colors duration-500">
                    <MapPin className="text-rose-500 w-5 h-5 md:w-7 md:h-7 group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg md:text-xl mb-2 md:mb-3 tracking-tight">Clinical Headquarters</h4>
                    <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed max-w-sm">{LAB_INFO.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 md:gap-8 group">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1.2rem] md:rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-rose-600 transition-colors duration-500">
                    <Phone className="text-rose-500 w-5 h-5 md:w-7 md:h-7 group-hover:text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg md:text-xl mb-1 md:mb-2 tracking-tight">Direct Helpline</h4>
                    <p className="text-slate-400 font-medium tracking-wide text-sm md:text-base">+91 {LAB_INFO.contact}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="glass-dark p-2 md:p-3 rounded-[3rem] md:rounded-[4rem] shadow-3xl hover:scale-[1.02] transition-transform duration-500">
              <a 
                href="https://maps.app.goo.gl/z4s13hUU7qKsxcLNA" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block bg-slate-900 h-[350px] md:h-[500px] rounded-[2.5rem] md:rounded-[3.5rem] relative flex items-center justify-center overflow-hidden border border-white/5 group cursor-pointer"
              >
                <div className="flex flex-col items-center gap-4 md:gap-6 z-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-rose-600/10 rounded-full flex items-center justify-center animate-pulse group-hover:bg-rose-600/20 transition-colors shadow-2xl shadow-rose-900/50 backdrop-blur-sm">
                     <MapPin className="text-rose-600 w-10 h-10 md:w-12 md:h-12" />
                  </div>
                  <div className="text-center bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
                    <p className="text-white font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[9px] md:text-[11px] group-hover:text-rose-400 transition-colors">System Geolocation Active</p>
                    <p className="text-white/50 text-[10px] mt-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 font-bold uppercase tracking-widest">Click to Navigate</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-rose-900/40 via-slate-950/40 to-slate-950/80 pointer-events-none group-hover:opacity-50 transition-opacity duration-500" />
                <img 
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800" 
                  alt="Map Location" 
                  className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                />
              </a>
            </div>
          </div>
        </section>
      </main>

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
                <li><button onClick={() => setView('login')} className="hover:text-rose-500 transition-colors">Administrator OS</button></li>
                <li><a href="#" className="hover:text-rose-500 transition-colors">Partner Dashboard</a></li>
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
          onComplete={(formData) => {
            mockApi.saveBooking({
              patientName: formData.name,
              tests: selectedTests,
              totalAmount: selectedTests.reduce((acc, t) => acc + t.price, 0),
              collectionType: formData.collectionType,
              scheduledDate: formData.date,
              paymentMode: formData.paymentMethod,
              paymentStatus: formData.paymentMethod === 'online' ? 'paid' : 'unpaid'
            });
            setSelectedTests([]);
            setIsWizardOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default App;