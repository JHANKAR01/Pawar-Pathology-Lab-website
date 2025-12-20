
import React, { useState } from 'react';
import { Check, ArrowRight, ArrowLeft, Calendar, CreditCard, User, ClipboardList } from 'lucide-react';
import { Test, CollectionType } from '../types';

interface BookingWizardProps {
  selectedTests: Test[];
  onComplete: (details: any) => void;
  onCancel: () => void;
}

const BookingWizard: React.FC<BookingWizardProps> = ({ selectedTests, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    collectionType: CollectionType.LAB_VISIT,
    date: '',
    time: ''
  });

  const total = selectedTests.reduce((acc, t) => acc + t.price, 0);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const steps = [
    { title: 'Summary', icon: ClipboardList },
    { title: 'Patient Info', icon: User },
    { title: 'Schedule', icon: Calendar },
    { title: 'Payment', icon: CreditCard }
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Progress Bar */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">New Test Booking</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > i + 1 ? <Check className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-bold uppercase ${step === i + 1 ? 'text-red-600' : 'text-gray-400'}`}>{s.title}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mb-4 ${step > i + 1 ? 'bg-green-500' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg mb-4">Test Selection Summary</h3>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {selectedTests.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="font-medium text-gray-700">{t.title}</span>
                    <span className="font-bold text-red-600">₹{t.price}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 mt-4 flex justify-between items-center">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-black text-red-600">₹{total}</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input 
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none" 
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                  <input 
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none" 
                    placeholder="Enter mobile"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input 
                  className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none" 
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Collection Mode</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setFormData({...formData, collectionType: CollectionType.LAB_VISIT})}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${formData.collectionType === CollectionType.LAB_VISIT ? 'border-red-600 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <span className="block font-bold">Lab Visit</span>
                      <span className="text-xs text-gray-500">Visit our Tikari center</span>
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, collectionType: CollectionType.HOME})}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${formData.collectionType === CollectionType.HOME ? 'border-red-600 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <span className="block font-bold">Home Collection</span>
                      <span className="text-xs text-gray-500">Staff will visit you</span>
                    </button>
                  </div>
               </div>
               {formData.collectionType === CollectionType.HOME && (
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Address</label>
                    <textarea 
                      className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none h-20"
                      placeholder="Street, Ward, Near Landmark..."
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                    ></textarea>
                 </div>
               )}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                    <input type="date" className="w-full px-4 py-2 border rounded-xl outline-none" onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Time Slot</label>
                    <select className="w-full px-4 py-2 border rounded-xl outline-none" onChange={e => setFormData({...formData, time: e.target.value})}>
                      <option>08:00 AM - 10:00 AM</option>
                      <option>10:00 AM - 12:00 PM</option>
                      <option>04:00 PM - 06:00 PM</option>
                    </select>
                  </div>
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Secure Payment via Razorpay</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Pay online to confirm your slot instantly. 100% secure encrypted payment gateway.</p>
              <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
                <p className="text-sm text-gray-500 mb-1">Amount Payable</p>
                <p className="text-4xl font-black text-gray-900">₹{total}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between">
          <button 
            disabled={step === 1}
            onClick={prevStep}
            className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition-all ${step === 1 ? 'opacity-0' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          
          {step < 4 ? (
            <button 
              onClick={nextStep}
              className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 shadow-lg"
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 shadow-lg"
            >
              Pay & Confirm <Check className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;
