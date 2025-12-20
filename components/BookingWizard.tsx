import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, Calendar, CreditCard, User, ClipboardList, Wallet, CheckCircle, MapPin, Loader2, Navigation } from 'lucide-react';
import { Test, CollectionType } from '../types';

interface BookingWizardProps {
  selectedTests: Test[];
  onComplete: (details: any) => void;
  onCancel: () => void;
}

const BookingWizard: React.FC<BookingWizardProps> = ({ selectedTests, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
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

  const total = selectedTests.reduce((acc, t) => acc + t.price, 0);

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
        console.error(err);
        setIsCapturingLocation(false);
        alert("Clinical Location Access Denied. Please enable GPS permissions for specimen pickup.");
      },
      { enableHighAccuracy: true }
    );
  };

  const nextStep = () => {
    if (step === 3 && formData.collectionType === CollectionType.HOME && !formData.coordinates) {
      alert("Precision location capture is required for home collection dispatch.");
      return;
    }
    setStep(s => s + 1);
  };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({ ...formData, paymentMethod });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col border border-white/20">
        <div className="bg-slate-50 px-10 py-8 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Diagnostic Scheduler</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Clinical Intake System</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-rose-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="p-10 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <h3 className="font-black text-lg mb-6 tracking-tight text-slate-900">Verification of Analysis Suite</h3>
              {selectedTests.map(t => (
                <div key={t.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-rose-600" />
                    <span className="font-bold text-slate-700">{t.title}</span>
                  </div>
                  <span className="font-black text-rose-600 tracking-tight">₹{t.price}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-8 mt-10 flex justify-between items-center">
                <span className="text-lg font-black text-slate-900">Aggregate Fee</span>
                <div className="text-right">
                   <p className="text-4xl font-black text-rose-600 tracking-tighter">₹{total}</p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inclusive of clinical taxes</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Patient Registry Name</label>
                  <input className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full legal name" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Secured Phone Node</label>
                  <input className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+91 Contact" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-2">Digital Correspondence (Email)</label>
                <input className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="results@email.com" />
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
                     className={`flex-1 p-8 rounded-[2rem] border-2 transition-all text-left group ${formData.collectionType === type ? 'border-rose-600 bg-rose-50 shadow-xl shadow-rose-100' : 'border-slate-50 hover:border-slate-200'}`}
                   >
                     <span className={`block font-black text-xl mb-2 ${formData.collectionType === type ? 'text-rose-600' : 'text-slate-900'}`}>{type === CollectionType.HOME ? 'Home Dispatch' : 'Lab Diagnostic'}</span>
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{type === CollectionType.HOME ? 'Field agents reach you' : 'Visit our Tikari facility'}</span>
                   </button>
                 ))}
               </div>

               {formData.collectionType === CollectionType.HOME && (
                 <div className="space-y-6 animate-in slide-in-from-top-4">
                    <button 
                      type="button"
                      onClick={captureLocation}
                      disabled={isCapturingLocation}
                      className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg ${formData.coordinates ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-900 text-white hover:bg-rose-600 active:scale-95'}`}
                    >
                      {isCapturingLocation ? <Loader2 className="animate-spin w-5 h-5" /> : formData.coordinates ? <CheckCircle className="w-5 h-5" /> : <Navigation className="w-5 h-5" />}
                      {formData.coordinates ? 'Coordinates Verified' : 'Synchronize Current Location'}
                    </button>
                    <textarea 
                      className="w-full px-6 py-6 bg-slate-50 border-2 border-transparent focus:border-rose-600 focus:bg-white rounded-2xl outline-none transition-all font-bold h-32"
                      placeholder="Detailed physical address for field agent navigation..."
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    />
                 </div>
               )}

               <div className="grid grid-cols-2 gap-6">
                  <input type="date" className="w-full px-6 py-4 bg-slate-50 border-0 rounded-2xl font-bold text-slate-600" onChange={e => setFormData({...formData, date: e.target.value})} />
                  <select className="w-full px-6 py-4 bg-slate-50 border-0 rounded-2xl font-bold text-slate-600 outline-none" onChange={e => setFormData({...formData, time: e.target.value})}>
                    <option>08:00 AM - 10:00 AM</option>
                    <option>10:00 AM - 12:00 PM</option>
                    <option>12:00 PM - 04:00 PM</option>
                  </select>
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 text-center animate-in slide-in-from-right-4">
              <div className="bg-slate-900 p-12 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/20 blur-3xl rounded-full" />
                 <p className="text-slate-400 uppercase font-black tracking-[0.5em] text-[10px] mb-4">Total Net Payable</p>
                 <p className="text-6xl font-black tracking-tighter">₹{total}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <button onClick={() => setPaymentMethod('online')} className={`p-8 rounded-[2.5rem] border-2 transition-all text-center ${paymentMethod === 'online' ? 'border-rose-600 bg-rose-50 shadow-xl shadow-rose-100' : 'border-slate-50'}`}>
                    <p className="font-black text-slate-900">Secure Online</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">UPI / Cards</p>
                 </button>
                 <button onClick={() => setPaymentMethod('cash')} className={`p-8 rounded-[2.5rem] border-2 transition-all text-center ${paymentMethod === 'cash' ? 'border-rose-600 bg-rose-50 shadow-xl shadow-rose-100' : 'border-slate-50'}`}>
                    <p className="font-black text-slate-900">In-Person Cash</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Pay on Pickup</p>
                 </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-10 py-8 border-t border-gray-100 flex justify-between items-center">
          <button disabled={step === 1} onClick={prevStep} className="font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 disabled:opacity-0 transition-all">Back</button>
          {step < 4 ? (
            <button onClick={nextStep} className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-rose-600 transition-all active:scale-95">Proceed</button>
          ) : (
            <button onClick={handleSubmit} className="bg-rose-600 text-white px-16 py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-rose-900/20 hover:bg-rose-700 transition-all active:scale-95">Confirm & Schedule</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;