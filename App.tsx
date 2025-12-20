
import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Mail, Instagram, Facebook, Clock, FlaskConical, User, ShieldCheck, ChevronRight } from 'lucide-react';
import Hero3D from './components/3D/Hero3D';
import TestSearch from './components/TestSearch';
import BookingWizard from './components/BookingWizard';
import AdminDashboard from './components/Dashboard/AdminDashboard';
import { Test, UserRole } from './types';
import { LAB_INFO } from './constants';

const App: React.FC = () => {
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [view, setView] = useState<'home' | 'admin' | 'worker'>('home');

  // Sample Mock Data
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

  const removeTest = (id: string) => {
    setSelectedTests(selectedTests.filter(t => t.id !== id));
  };

  if (view === 'admin') return <AdminDashboard />;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <div className="bg-red-600 text-white py-2 px-4 text-[10px] md:text-xs font-bold uppercase tracking-widest flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {LAB_INFO.contact}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Tikari, Betul</span>
        </div>
        <div className="flex gap-4">
           <span>Owner: {LAB_INFO.owner}</span>
           <span className="opacity-70">Medical Head: {LAB_INFO.medicalHead}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <FlaskConical className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="font-black text-xl leading-none">PAWAR</h2>
            <p className="text-[10px] font-bold text-gray-400">LAB BETUL</p>
          </div>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold text-gray-600">
          <a href="#home" className="hover:text-red-600">Home</a>
          <a href="#tests" className="hover:text-red-600">Tests</a>
          <a href="#about" className="hover:text-red-600">About Us</a>
          <a href="#contact" className="hover:text-red-600">Contact</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setView('admin')} className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50">
            <User className="w-6 h-6" />
          </button>
          {selectedTests.length > 0 && (
            <button 
              onClick={() => setIsWizardOpen(true)}
              className="bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-red-200 animate-pulse flex items-center gap-2"
            >
              Checkout ({selectedTests.length}) <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home">
        <Hero3D />
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="font-bold">NABL Certified</h4>
            <p className="text-xs text-gray-500">Highest quality standards</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h4 className="font-bold">Fast Results</h4>
            <p className="text-xs text-gray-500">Report in 12-24 hours</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8" />
            </div>
            <h4 className="font-bold">Home Sample</h4>
            <p className="text-xs text-gray-500">Convenience at your door</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-4">
              <FlaskConical className="w-8 h-8" />
            </div>
            <h4 className="font-bold">Expert Pathologist</h4>
            <p className="text-xs text-gray-500">Verified by Dr. Rahul Karode</p>
          </div>
        </div>
      </section>

      {/* Test Catalog */}
      <TestSearch tests={mockTests} onSelect={handleTestSelect} />

      {/* Cart Drawer (Visible on Mobile/Floating) */}
      {selectedTests.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-gray-900 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-white/10 glass max-w-sm">
             <div>
               <p className="text-[10px] text-gray-400 uppercase font-black">Selection</p>
               <p className="text-lg font-bold">{selectedTests.length} Items</p>
             </div>
             <button 
                onClick={() => setIsWizardOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-2xl font-bold transition-all"
             >
                Book Now
             </button>
          </div>
        </div>
      )}

      {/* Booking Wizard Modal */}
      {isWizardOpen && (
        <BookingWizard 
          selectedTests={selectedTests} 
          onCancel={() => setIsWizardOpen(false)}
          onComplete={(data) => {
            console.log("Booking Completed:", data);
            alert("Booking Confirmed! (Demo Mode - Check Console for Payload)");
            setIsWizardOpen(false);
            setSelectedTests([]);
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-6 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold">P</div>
              <h2 className="text-xl font-bold uppercase">Pawar Lab</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Betul's trusted diagnostic partner. We provide precise, reliable and affordable laboratory services using world-class technology.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-lg">Quick Links</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-red-600 transition-colors">Check Reports</a></li>
              <li><a href="#" className="hover:text-red-600 transition-colors">Test Prices</a></li>
              <li><a href="#" className="hover:text-red-600 transition-colors">Health Packages</a></li>
              <li><a href="#" className="hover:text-red-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-lg">Contact Info</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="text-red-600 w-5 h-5 flex-shrink-0" />
                <span>{LAB_INFO.location}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-red-600 w-5 h-5" />
                <span>{LAB_INFO.contact}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-red-600 w-5 h-5" />
                <span>info@pawarlabs.in</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-lg">Operating Hours</h4>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex justify-between"><span>Mon - Sat:</span> <span>08:00 AM - 08:00 PM</span></li>
              <li className="flex justify-between"><span>Sunday:</span> <span>08:00 AM - 01:00 PM</span></li>
              <li className="mt-4 p-4 bg-red-600/10 border border-red-600/20 rounded-xl text-xs text-red-500 font-bold text-center">
                Emergency services available on call
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-gray-800 mt-16 pt-8 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} Pawar Pathology Lab. All rights reserved. Designed for Excellence in Diagnostics.
        </div>
      </footer>
    </div>
  );
};

export default App;
