
import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Mail, Instagram, Facebook, Clock, FlaskConical, User, ShieldCheck, ChevronRight, Briefcase, Home, LogOut, HeartHandshake, LogIn } from 'lucide-react';
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

  // Check for existing session on mount
  useEffect(() => {
    const user = mockApi.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const mockTests: Test[] = [
    { id: '1', title: 'CBC - Complete Blood Count', category: 'Hematology', price: 350, description: 'Measures your red cells, white cells, and platelets. Vital for infection check.', isHomeCollectionAvailable: true, fastingRequired: false },
    { id: '2', title: 'Lipid Profile', category: 'Biochemistry', price: 750, description: 'Comprehensive cholesterol test including HDL, LDL, and Triglycerides.', isHomeCollectionAvailable: true, fastingRequired: true },
    { id: '3', title: 'HbA1c - Diabetes Care', category: 'Biochemistry', price: 550, description: 'Average blood sugar levels over the past 3 months.', isHomeCollectionAvailable: true, fastingRequired: false },
    { id: '4', title: 'Thyroid Profile (T3, T4, TSH)', category: 'Hormones', price: 600, description: 'Assess thyroid gland function and metabolic health.', isHomeCollectionAvailable: true, fastingRequired: false },
    { id: '5', title: 'Vitamin B12', category: 'Special Tests', price: 1200, description: 'Checks for deficiencies vital for nerve health and brain function.', isHomeCollectionAvailable: true, fastingRequired: true },
    { id: '6', title: 'Liver Function Test (LFT)', category: 'Biochemistry', price: 900, description: 'Evaluate liver health, enzymes, and protein levels.', isHomeCollectionAvailable: true, fastingRequired: false },
  ];

  const handleTestSelect = (test: Test) => {
    if (!selectedTests.find(t => t.id === test.id)) {
      setSelectedTests([...selectedTests, test]);
    }
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
    alert("Booking Saved! Our staff will confirm your slot shortly.");
  };

  const handleLoginSuccess = (user: UserType) => {
    setCurrentUser(user);
    if (user.role === UserRole.ADMIN) setView('admin');
    else if (user.role === UserRole.PARTNER) setView('partner');
    else setView('home');
  };

  const handleLogout = () => {
    mockApi.logout();
    setCurrentUser(null);
    setView('home');
  };

  const handlePortalClick = () => {
    if (currentUser) {
      if (currentUser.role === UserRole.ADMIN) setView('admin');
      else if (currentUser.role === UserRole.PARTNER) setView('partner');
      else setView('home');
    } else {
      setView('login');
    }
  };

  // RBAC Component Guarding
  if (view === 'login') return <LoginPage onLoginSuccess={handleLoginSuccess} onBack={() => setView('home')} />;
  
  if (view === 'admin') {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      setView('login');
      return null;
    }
    return <AdminDashboard onLogout={handleLogout} />;
  }

  if (view === 'partner') {
    if (!currentUser || (currentUser.role !== UserRole.PARTNER && currentUser.role !== UserRole.ADMIN)) {
      setView('login');
      return null;
    }
    return <PartnerDashboard onLogout={handleLogout} />;
  }

  return (
    <div className="flex flex-col min-h-screen animate-in fade-in duration-700">
      {/* Top Contact Bar */}
      <div className="bg-red-600 text-white py-2 px-6 text-[10px] md:text-xs font-bold uppercase tracking-widest flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {LAB_INFO.contact}</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {LAB_INFO.location.split(',')[0]}</span>
        </div>
        <div className="flex gap-6">
           <span>Owner: {LAB_INFO.owner}</span>
           <span className="opacity-80">Medical Head: {LAB_INFO.medicalHead}</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
            <FlaskConical className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-xl leading-none tracking-tight">PAWAR</h2>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Pathology Lab</p>
          </div>
        </div>

        <div className="hidden md:flex gap-10 text-sm font-bold text-gray-500">
          <a href="#home" className="hover:text-red-600 transition-colors">Home</a>
          <a href="#tests" className="hover:text-red-600 transition-colors">Test Directory</a>
          <a href="#" className="hover:text-red-600 transition-colors">About Us</a>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {currentUser ? (
              <div className="flex items-center">
                <button 
                  onClick={handlePortalClick}
                  className="p-2 rounded-lg transition-all flex items-center gap-2 font-bold text-sm text-red-600 bg-white shadow-sm"
                  title={`Logged in as ${currentUser.name}`}
                >
                  {currentUser.role === UserRole.PARTNER ? <HeartHandshake className="w-5 h-5" /> : currentUser.role === UserRole.ADMIN ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  <span className="hidden lg:inline">{currentUser.role === UserRole.ADMIN ? 'Admin' : currentUser.role === UserRole.PARTNER ? 'Partner' : 'Account'}</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 ml-1 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setView('login')}
                className="p-2 px-4 rounded-lg transition-all flex items-center gap-2 font-bold text-sm text-gray-500 hover:text-red-600 hover:bg-white"
              >
                <LogIn className="w-5 h-5" />
                <span>Portal Login</span>
              </button>
            )}
          </div>
          
          {selectedTests.length > 0 && (
            <button 
              onClick={() => setIsWizardOpen(true)}
              className="bg-red-600 text-white px-6 py-2.5 rounded-full font-bold shadow-xl shadow-red-100 flex items-center gap-2 hover:bg-red-700 hover:scale-105 active:scale-95 transition-all"
            >
              Checkout ({selectedTests.length}) <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <main>
        <section id="home">
          <Hero3D />
        </section>

        <section className="py-16 bg-white border-y border-gray-50">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { icon: ShieldCheck, title: "NABL Certified", sub: "Global Standards" },
              { icon: Clock, title: "Same Day Result", sub: "Speed & Accuracy" },
              { icon: MapPin, title: "Home Collection", sub: "Doorstep Service" },
              { icon: User, title: "Expert MD Dr.", sub: "Verified Reports" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                  <item.icon className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-400 font-medium">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="tests" className="bg-gray-50 pb-20">
          <TestSearch tests={mockTests} onSelect={handleTestSelect} />
        </section>
      </main>

      {/* Modals */}
      {isWizardOpen && (
        <BookingWizard 
          selectedTests={selectedTests} 
          onCancel={() => setIsWizardOpen(false)}
          onComplete={handleBookingComplete}
        />
      )}

      {/* Footer */}
      <footer className="bg-[#111] text-white py-20 px-6 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <FlaskConical className="text-red-600 w-8 h-8" />
              <h2 className="text-2xl font-black">PAWAR LAB</h2>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">
              Betul's leading diagnostic center, dedicated to precision and patient care. 
              Advanced technology meets expert medical analysis.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-600 transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-600 transition-colors"><Facebook className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-8 text-white/90 uppercase tracking-widest text-xs">Navigation</h4>
            <ul className="space-y-4 text-gray-500 text-sm font-medium">
              <li><a href="#home" className="hover:text-red-500 transition-colors">Home</a></li>
              <li><a href="#tests" className="hover:text-red-500 transition-colors">Test Pricing</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Book Home Sample</a></li>
              <li><button onClick={() => setView('login')} className="hover:text-red-500 transition-colors text-left">Staff Portal Login</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-8 text-white/90 uppercase tracking-widest text-xs">Our Center</h4>
            <div className="space-y-6 text-gray-500 text-sm font-medium">
              <div className="flex items-start gap-3">
                <MapPin className="text-red-600 w-5 h-5 mt-0.5 shrink-0" />
                <p>{LAB_INFO.location}</p>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="text-red-600 w-5 h-5 shrink-0" />
                <p>+91 {LAB_INFO.contact}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
            <h4 className="font-bold mb-4 text-lg">Lab Hours</h4>
            <div className="space-y-3 text-sm text-gray-400 font-medium">
              <div className="flex justify-between"><span>Mon - Sat</span> <span className="text-white">8:00 AM - 8:00 PM</span></div>
              <div className="flex justify-between"><span>Sunday</span> <span className="text-white">8:00 AM - 2:00 PM</span></div>
              <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-green-400 font-bold">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Open Now
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-20 pt-8 text-center text-gray-600 text-[10px] font-black uppercase tracking-widest">
          &copy; {new Date().getFullYear()} Pawar Pathology Lab. Built for Precision & Reliability.
        </div>
      </footer>
    </div>
  );
};

export default App;
