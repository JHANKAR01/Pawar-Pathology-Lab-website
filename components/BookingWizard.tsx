import React, { useState, useEffect, useMemo } from 'react';
import { Check, Calendar, CreditCard, User, CheckCircle, MapPin, Loader2, Navigation, Ticket, UserPlus, X, AlertTriangle, DollarSign, Mail } from 'lucide-react';
import { Test, CollectionType } from '../types';

interface BookingWizardProps {
  selectedTests: Test[];
  onComplete: (details: any) => void;
  onCancel: () => void;
}

const BookingWizard: React.FC<BookingWizardProps> = ({ selectedTests, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isBookingForSelf, setIsBookingForSelf] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('cash');
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [amountTaken, setAmountTaken] = useState(0); // For partial payments
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    collectionType: CollectionType.LAB_VISIT,
    date: '',
    time: '',
    coordinates: null as { lat: number; lng: number } | null,
    referredBy: 'Self'
  });

  const currentUser = useMemo(() => {
    const user = localStorage.getItem('pawar_lab_auth_token');
    return user ? JSON.parse(user) : null;
  }, []);

  // Only pre-fill logic on initial mount or when specifically toggling self-booking ON.
  useEffect(() => {
    if (isBookingForSelf && currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      }));
    } else if (!isBookingForSelf) {
      // Clear data only when explicitly switching to "someone else"
      setFormData(prev => ({ ...prev, name: '', email: '', phone: '' }));
    }
  }, [isBookingForSelf, currentUser]);

  const baseTotal = selectedTests.reduce((acc, t) => acc + t.price, 0);
  const finalTotal = Math.max(0, baseTotal - discount);

  useEffect(() => {
    if (currentUser?.role === 'patient') {
      setAmountTaken(finalTotal);
    }
  }, [finalTotal, currentUser]);

  const balanceAmount = Math.max(0, finalTotal - amountTaken);

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'SAVE10') {
      setDiscount(baseTotal * 0.1);
      setError('');
    } else {
      setDiscount(0);
      setError('Invalid Promo Code');
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
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
        alert("Location access denied.");
      },
      { enableHighAccuracy: true }
    );
  };

  const validateCurrentStep = () => {
    setError('');
    if (step === 2) {
      if (!formData.name) return "Patient name is required.";
      if (!formData.phone || formData.phone.length !== 10) return "Please enter a valid 10-digit phone number.";
      // Email is optional for guests, but good to collect
    }
    if (step === 3) {
      if (!formData.date) return "Please select a preferred date.";
      if (formData.collectionType === CollectionType.HOME && !formData.coordinates) {
        return "Precision location sync is required for home visits.";
      }
    }
    return null;
  };

  const nextStep = () => {
    const err = validateCurrentStep();
    if (err) {
      setError(err);
      return;
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = () => {
    let finalPaymentStatus;
    let finalBalanceAmount;

    if (paymentMethod === 'cash') {
      finalBalanceAmount = finalTotal - amountTaken;
      finalPaymentStatus = finalBalanceAmount > 0 ? 'partial' : 'unpaid'; // Mark as unpaid if no amount taken
    } else {
      finalPaymentStatus = 'paid';
      finalBalanceAmount = 0;
    }

    onComplete({ 
      ...formData,
      referredBy: formData.referredBy || 'Self',
      paymentMethod, 
      totalAmount: finalTotal,
      amountTaken: amountTaken,
      balanceAmount: finalBalanceAmount,
      paymentStatus: finalPaymentStatus
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
        <div className="bg-slate-50 px-10 py-8 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Clinical Scheduler</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Diagnostic Intake V2</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-rose-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 overflow-y-auto">
          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm animate-in slide-in-from-top">
              <AlertTriangle size={18} /> {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="font-black text-lg mb-6 tracking-tight text-slate-900 uppercase">Review Selected Tests</h3>
              {selectedTests.map(t => (
                <div key={t._id} className="flex justify-between items-center p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                  <span className="font-bold text-slate-700">{t.title}</span>
                  <span className="font-black text-rose-600">₹{t.price}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-8 mt-10 flex justify-between items-center">
                <span className="text-lg font-black text-slate-900">Base Estimate</span>
                <p className="text-3xl font-black text-rose-600 tracking-tighter">₹{baseTotal}</p>
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
                  <input 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Full name" 
                    readOnly={isBookingForSelf}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Contact Number</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">+91</span>
                    <input 
                      className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold" 
                      value={formData.phone} 
                      maxLength={10} 
                      onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} 
                      placeholder="10 digits" 
                      readOnly={isBookingForSelf}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    placeholder="For report delivery (Optional)" 
                    readOnly={isBookingForSelf}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Referred By</label>
                <input 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold" 
                  value={formData.referredBy} 
                  onChange={e => setFormData({...formData, referredBy: e.target.value})} 
                  placeholder="e.g., Dr. Smith or Self"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
               <div className="flex gap-4">
                 {[CollectionType.LAB_VISIT, CollectionType.HOME].map(type => (
                   <button 
                     key={type}
                     onClick={() => setFormData({...formData, collectionType: type})}
                     className={`flex-1 p-8 rounded-[2rem] border-2 transition-all text-left ${formData.collectionType === type ? 'border-rose-600 bg-rose-50 shadow-xl' : 'border-slate-50'}`}
                   >
                     <span className={`block font-black text-xl mb-1 ${formData.collectionType === type ? 'text-rose-600' : 'text-slate-900'}`}>{type === CollectionType.HOME ? 'Home Dispatch' : 'Lab Visit'}</span>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{type === CollectionType.HOME ? 'Collection at site' : 'Visit Link Road'}</span>
                   </button>
                 ))}
               </div>

               {formData.collectionType === CollectionType.HOME && (
                 <div className="space-y-6">
                    <button 
                      type="button"
                      onClick={captureLocation}
                      disabled={isCapturingLocation}
                      className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all ${formData.coordinates ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white'}`}
                    >
                      {isCapturingLocation ? <Loader2 className="animate-spin" /> : formData.coordinates ? <CheckCircle /> : <Navigation />}
                      {formData.coordinates ? 'Location Synced' : 'Sync Current Location'}
                    </button>
                    <textarea 
                      className="w-full px-6 py-6 bg-slate-50 border-0 rounded-2xl outline-none font-bold h-32"
                      placeholder="Full Address & Landmarks..."
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                 </div>
               )}

               <div className="grid grid-cols-2 gap-6">
                  <input type="date" className="w-full px-6 py-4 bg-slate-50 border-0 rounded-2xl font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  <select className="w-full px-6 py-4 bg-slate-50 border-0 rounded-2xl font-bold outline-none" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}>
                    <option value="">Select Time Slot</option>
                    <option>08:00 AM - 10:00 AM</option>
                    <option>10:00 AM - 12:00 PM</option>
                    <option>12:00 PM - 04:00 PM</option>
                  </select>
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 text-center">
              <div className="bg-slate-900 p-10 rounded-[3rem] text-white">
                 <p className="text-slate-400 uppercase font-black tracking-widest text-[10px] mb-2">Final Amount</p>
                 <p className="text-6xl font-black tracking-tighter">₹{finalTotal}</p>
                 {discount > 0 && <p className="text-xs font-bold text-emerald-400 mt-2 uppercase">Promo Applied (-₹{discount})</p>}
              </div>

              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Ticket className="text-rose-600" />
                <input 
                  placeholder="Coupon Code" 
                  className="bg-transparent border-0 outline-none font-bold text-slate-900 flex-1 uppercase"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                />
                <button onClick={applyPromo} className="text-rose-600 font-black text-xs uppercase hover:text-rose-800">Apply</button>
              </div>

              {currentUser?.role !== 'patient' && (
                <div className="p-6 bg-slate-50 rounded-2xl text-left space-y-4">
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Amount Paid Now (Cash/Partial)</label>
                      <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                          <input 
                              type="number" 
                              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 font-bold"
                              value={amountTaken}
                              onChange={(e) => setAmountTaken(Number(e.target.value))}
                              max={finalTotal}
                          />
                      </div>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="font-bold text-sm text-slate-500">Balance Due:</span>
                      <span className="font-black text-rose-600 text-lg">₹{balanceAmount}</span>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                 <button onClick={() => setPaymentMethod('online')} className={`p-6 rounded-[2rem] border-2 transition-all ${paymentMethod === 'online' ? 'border-rose-600 bg-rose-50 shadow-xl' : 'border-slate-50'}`}>
                    <p className="font-black text-slate-900 uppercase text-xs">Online</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">UPI / Card</p>
                 </button>
                 <button onClick={() => setPaymentMethod('cash')} className={`p-6 rounded-[2rem] border-2 transition-all ${paymentMethod === 'cash' ? 'border-rose-600 bg-rose-50 shadow-xl' : 'border-slate-50'}`}>
                    <p className="font-black text-slate-900 uppercase text-xs">Cash</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Pay at Lab</p>
                 </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-10 py-8 border-t border-gray-100 flex justify-between items-center">
          <button disabled={step === 1} onClick={prevStep} className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-0">Back</button>
          {step < 4 ? (
            <button onClick={nextStep} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-rose-600 transition-all">Continue</button>
          ) : (
            <button onClick={handleSubmit} className="bg-rose-600 text-white px-16 py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-rose-700 transition-all">Confirm Booking</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;