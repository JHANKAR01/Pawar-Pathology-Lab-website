

import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, ArrowLeft, Calendar, CreditCard, User, ClipboardList, Wallet, CheckCircle, MapPin, Loader2, Navigation, Ticket, UserPlus } from 'lucide-react';
import { Test, CollectionType } from '../types';
import { mockApi } from '../lib/mockApi';

interface BookingWizardProps {
  selectedTests: Test[];
  onComplete: (details: any) => void;
  onCancel: () => void;
}

const BookingWizard: React.FC<BookingWizardProps> = ({ selectedTests, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isBookingForSelf, setIsBookingForSelf] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    collectionType: CollectionType.LAB_VISIT,
    date: '',
    time: '',
    coordinates: null as { lat: number; lng: number } | null
  });

  useEffect(() => {
    const user = mockApi.getCurrentUser();
    if (user && isBookingForSelf) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    } else if (!isBookingForSelf) {
      setFormData(prev => ({ ...prev, name: '', email: '', phone: '' }));
    }
  }, [isBookingForSelf]);

  const baseTotal = selectedTests.reduce((acc, t) => acc + t.price, 0);
  const finalTotal = Math.max(0, baseTotal - discount);

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'SAVE10') {
      setDiscount(baseTotal * 0.1);
      alert('Promo applied: 10% discount enabled.');
    } else {
      alert('Invalid promo code.');
      setDiscount(0);
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("Geographic node acquisition is not supported by your browser.");
      return;
    }
    setIsCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({ ...prev, coordinates: { lat: pos.coords.latitude, lng: pos.coords.longitude } }));
        setIsCapturingLocation(false);
      },
      (err) => {
        setIsCapturingLocation(false);
        alert("Clinical Location Access Denied. Please enable GPS permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Fix: Defined prevStep to allow backwards navigation in the wizard
  const prevStep = () => {
    setStep(s => s - 1);
  };

  const nextStep = () => {
    if (step === 2) {
      if (!formData.name || !formData.phone) {
        alert("Patient details are mandatory.");
        return;
      }
      if (formData.phone.length !== 10) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
      }
    }
    if (step === 3 && formData.collectionType === CollectionType.HOME && !formData.coordinates) {
      alert("Precision location capture is required for home collection dispatch.");
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ ...formData, paymentMethod, totalAmount: finalTotal });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
        <div className="bg-slate-50 px-10 py-8 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Diagnostic Scheduler</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Clinical Intake System</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-rose-600 transition-colors">
            <XIcon />
          </button>
        </div>

        <div className="p-10 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="font-black text-lg mb-6 tracking-tight text-slate-900">Analysis Summary</h3>
              {selectedTests.map(t => (
                <div key={t.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-rose-600" />
                    <span className="font-bold text-slate-700">{t.title}</span>
                  </div>
                  <span className="font-black text-rose-600">₹{t.price}</span>
                </div>
              ))}

              <div className="mt-8 p-6 bg-rose-50 rounded-[2rem] border border-rose-100 flex gap-4 items-center">
                <Ticket className="text-rose-600 w-6 h-6" />
                <input 
                  placeholder="Promo Code (SAVE10)" 
                  className="bg-transparent border-0 outline-none font-bold text-rose-900 uppercase placeholder:text-rose-300 flex-1"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                />
                <button onClick={applyPromo} className="text-rose-600 font-black text-[10px] uppercase tracking-widest hover:text-rose-800">Apply</button>
              </div>

              <div className="border-t border-slate-100 pt-8 mt-10 flex justify-between items-center">
                <span className="text-lg font-black text-slate-900">Final Fee</span>
                <div className="text-right">
                   <p className="text-4xl font-black text-rose-600 tracking-tighter">₹{finalTotal}</p>
                   {discount > 0 && <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest line-through">₹{baseTotal}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-4">
                 <UserPlus className="text-rose-600" />
                 <span className="text-sm font-bold text-slate-700">Booking for someone else?</span>
                 <input 
                    type="checkbox" 
                    className="ml-auto w-5 h-5 accent-rose-600"
                    checked={!isBookingForSelf}
                    onChange={() => setIsBookingForSelf(!isBookingForSelf)}
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Patient Name</label>
                  <input className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Contact Number</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">+91</span>
                    <input className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold" value={formData.phone} maxLength={10} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} placeholder="10 digits" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Email (For Reports)</label>
                <input className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="results@pawarpathlab.com" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
               <div className="flex gap-4">
                 {[CollectionType.LAB_VISIT, CollectionType.HOME].map(type => (
                   <button 
                     key={type}
                     onClick={() => setFormData({...formData, collectionType: type})}
                     className={`flex-1 p-8 rounded-[2rem] border-2 transition-all text-left ${formData.collectionType === type ? 'border-rose-600 bg-rose-50 shadow-xl' : 'border-slate-50'}`}
                   >
                     <span className={`block font-black text-xl mb-2 ${formData.collectionType === type ? 'text-rose-600' : 'text-slate-900'}`}>{type === CollectionType.HOME ? 'Home Dispatch' : 'Lab Visit'}</span>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{type === CollectionType.HOME ? 'Field agents reach you' : 'Visit our link road center'}</span>
                   </button>
                 ))}
               </div>

               {formData.collectionType === CollectionType.HOME && (
                 <div className="space-y-6 animate-in slide-in-from-top-4">
                    <button 
                      type="button"
                      onClick={captureLocation}
                      disabled={isCapturingLocation}
                      className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg ${formData.coordinates ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-900 text-white hover:bg-rose-600'}`}
                    >
                      {isCapturingLocation ? <Loader2 className="animate-spin w-5 h-5" /> : formData.coordinates ? <CheckCircle className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
                      {formData.coordinates ? 'Coordinates Captured' : 'Synchronize Location'}
                    </button>
                    <textarea 
                      className="w-full px-6 py-6 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold h-32"
                      placeholder="Detailed address landmarks..."
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                 </div>
               )}

               <div className="grid grid-cols-2 gap-6">
                  <input type="date" className="w-full px-6 py-4 bg-slate-50 border-0 rounded-2xl font-bold" onChange={e => setFormData({...formData, date: e.target.value})} />
                  <select className="w-full px-6 py-4 bg-slate-50 border-0 rounded-2xl font-bold outline-none" onChange={e => setFormData({...formData, time: e.target.value})}>
                    <option>08:00 AM - 10:00 AM</option>
                    <option>10:00 AM - 12:00 PM</option>
                    <option>12:00 PM - 04:00 PM</option>
                  </select>
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 text-center">
              <div className="bg-slate-900 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                 <p className="text-slate-400 uppercase font-black tracking-[0.5em] text-[10px] mb-4">Amount Payable</p>
                 <p className="text-6xl font-black tracking-tighter">₹{finalTotal}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <button onClick={() => setPaymentMethod('online')} className={`p-8 rounded-[2.5rem] border-2 transition-all ${paymentMethod === 'online' ? 'border-rose-600 bg-rose-50 shadow-xl shadow-rose-100' : 'border-slate-50'}`}>
                    <p className="font-black text-slate-900">Secure Online</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">UPI / Cards</p>
                 </button>
                 <button onClick={() => setPaymentMethod('cash')} className={`p-8 rounded-[2.5rem] border-2 transition-all ${paymentMethod === 'cash' ? 'border-rose-600 bg-rose-50 shadow-xl shadow-rose-100' : 'border-slate-50'}`}>
                    <p className="font-black text-slate-900">Pay on Visit</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Cash / QR</p>
                 </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-10 py-8 border-t border-gray-100 flex justify-between items-center">
          <button disabled={step === 1} onClick={prevStep} className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all">Back</button>
          {step < 4 ? (
            <button onClick={nextStep} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-rose-600 transition-all">Continue</button>
          ) : (
            <button onClick={handleSubmit} className="bg-rose-600 text-white px-16 py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-rose-900/20 hover:bg-rose-700 transition-all active:scale-95">Finalize Booking</button>
          )}
        </div>
      </div>
    </div>
  );
};

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

export default BookingWizard;