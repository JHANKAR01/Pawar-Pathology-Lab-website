import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Check, Calendar, CreditCard, User, CheckCircle, MapPin, Loader2, Navigation, Ticket, UserPlus, X, AlertTriangle, DollarSign, Mail } from 'lucide-react';
import { Test, CollectionType } from '../types';

interface BookingWizardProps {
  selectedTests: Test[];
  onComplete: (details: any) => void;
  onCancel: () => void;
  onTestRemove: (test: Test) => void;
}

interface BlackoutDate {
  reason: string;
  startDate: string;
  endDate: string;
}

const BookingWizard: React.FC<BookingWizardProps> = ({ selectedTests, onComplete, onCancel, onTestRemove }) => {
  const [step, setStep] = useState(1);
  const [isBookingForSelf, setIsBookingForSelf] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('cash');
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [amountTaken, setAmountTaken] = useState(0); // For partial payments
  const [error, setError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);

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

  const { data: session } = useSession();
  const currentUser = session?.user;

  useEffect(() => {
    const fetchBlackoutDates = async () => {
      try {
        const res = await fetch('/api/settings/blackout-dates');
        if (res.ok) {
          setBlackoutDates(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch blackout dates:", error);
      }
    };

    fetchBlackoutDates();
  }, []);

  useEffect(() => {
    if (isBookingForSelf && currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || ''
      }));
    } else {
      // Clear fields if booking for someone else
      setFormData(prev => ({ ...prev, name: '', email: '', phone: '', address: '' }));
    }
  }, [isBookingForSelf, currentUser]);

  useEffect(() => {
    if (selectedTests.length === 0) {
      onCancel();
    }
  }, [selectedTests, onCancel]);

  const baseTotal = selectedTests.reduce((acc, t) => acc + t.price, 0);
  const finalTotal = Math.max(0, baseTotal - discount);

  useEffect(() => {
    if (currentUser?.role === 'patient') {
      setAmountTaken(finalTotal);
    }
  }, [finalTotal, currentUser]);

  const balanceAmount = Math.max(0, finalTotal - amountTaken);

  const applyPromo = async () => {
    if (!promoCode.trim()) {
      setError('Please enter a coupon code');
      setDiscount(0);
      return;
    }

    setIsValidatingCoupon(true);
    setError('');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promoCode.trim(),
          totalAmount: baseTotal
        })
      });

      const data = await response.json();

      if (data.valid) {
        setDiscount(data.discount || 0);
        setError('');
      } else {
        setDiscount(0);
        setError(data.error || 'Invalid coupon code');
        setPromoCode('');
      }
    } catch (err) {
      console.error('Coupon validation error:', err);
      setDiscount(0);
      setError('Failed to validate coupon. Please try again.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const captureLocation = () => {
    // Security check for Geolocation API requirements
    if (window.location.hostname !== 'localhost' && window.location.protocol !== 'https:') {
      alert("Browser Security Warning: Geolocation requires HTTPS or localhost. Please use a secure connection.");
      return;
    }

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
        console.error("Geo Error:", err);
        let msg = "Location access denied.";
        if (err.code === 1) msg = "User denied location permission. Please enable it in browser settings.";
        if (err.code === 2) msg = "Location unavailable. Check GPS/Network.";
        if (err.code === 3) msg = "Location request timed out.";
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isSunday = (dateString: string) => {
    const date = new Date(dateString);
    return date.getUTCDay() === 0;
  };

  const [settings, setSettings] = useState<any>({
    locationFencingEnabled: false,
    serviceRadius: 10,
    blockSundays: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };
    fetchSettings();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  // Re-calculate distance whenever coordinates or settings change
  useEffect(() => {
    const calc = async () => {
      if (!formData.coordinates || !settings.locationFencingEnabled) {
        setCalculatedDistance(null);
        return;
      }

      const { lat, lng } = formData.coordinates;
      const labLat = 21.9015;
      const labLng = 77.8961;

      if (settings.distanceType === 'road') {
        setIsCalculatingDistance(true);
        try {
          // Use OSRM public API
          const url = `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${labLng},${labLat}?overview=false`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
              setCalculatedDistance(data.routes[0].distance / 1000); // meters to km
            } else {
              setCalculatedDistance(calculateDistance(labLat, labLng, lat, lng));
            }
          } else {
            setCalculatedDistance(calculateDistance(labLat, labLng, lat, lng));
          }
        } catch (e) {
          setCalculatedDistance(calculateDistance(labLat, labLng, lat, lng));
        } finally {
          setIsCalculatingDistance(false);
        }
      } else {
        // Displacement
        setCalculatedDistance(calculateDistance(labLat, labLng, lat, lng));
      }
    };

    calc();
  }, [formData.coordinates, settings.locationFencingEnabled, settings.distanceType]);

  const validateCurrentStep = () => {
    setError('');
    if (step === 2) {
      if (!formData.name) return "Patient name is required.";
      if (!formData.phone || formData.phone.length !== 10) return "Please enter a valid 10-digit phone number.";
    }
    if (step === 3) {
      if (formData.collectionType === CollectionType.HOME) {
        if (!formData.coordinates) {
          return "Precision location sync is required for home visits.";
        }

        if (isCalculatingDistance) {
          return "Calculating distance... please wait.";
        }

        // Geofencing Check
        if (settings.locationFencingEnabled && calculatedDistance !== null) {
          if (calculatedDistance > settings.serviceRadius) {
            return `Location is ${calculatedDistance.toFixed(1)}km away via ${settings.distanceType || 'displacement'}. Our limit is ${settings.serviceRadius}km.`;
          }
        }
      }

      if (!formData.date) return "Please select a preferred date.";

      // Dynamic Sunday Check
      if (settings.blockSundays && isSunday(formData.date)) {
        return "Sundays are not available for bookings. Please choose another day.";
      }

      for (const block of blackoutDates) {
        if (formData.date >= block.startDate && formData.date <= block.endDate) {
          return `Lab closed for ${block.reason}. Please select another date.`;
        }
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
    let finalAmountTakenForSubmit = amountTaken;
    let finalCalculatedBalance = finalTotal - finalAmountTakenForSubmit;

    // Calculate distance for saving
    let dist = 0;
    if (formData.coordinates) {
      dist = calculateDistance(21.9015, 77.8961, formData.coordinates.lat, formData.coordinates.lng);
    }

    if (paymentMethod === 'online') {
      finalPaymentStatus = 'paid';
      finalAmountTakenForSubmit = finalTotal;
      finalCalculatedBalance = 0;
    } else {
      finalPaymentStatus = 'unpaid';
      finalAmountTakenForSubmit = 0;
      finalCalculatedBalance = finalTotal;
    }

    onComplete({
      ...formData,
      referredBy: formData.referredBy || 'Self',
      paymentMethod,
      totalAmount: finalTotal,
      amountTaken: finalAmountTakenForSubmit,
      balanceAmount: finalCalculatedBalance,
      paymentStatus: finalPaymentStatus,
      distanceFromLab: dist, // Save calculated distance
      couponCode: promoCode || undefined,
      discountAmount: discount
    });
  };

  const inputStyles = "w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none transition-all font-bold text-slate-900 focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 placeholder:text-slate-400";

  // Update handleDateChange to use dynamic setting
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    if (settings.blockSundays && isSunday(selectedDate)) {
      setError("Sundays are not available for bookings. Please choose another day.");
      setFormData({ ...formData, date: '' });
      return;
    }

    for (const block of blackoutDates) {
      if (selectedDate >= block.startDate && selectedDate <= block.endDate) {
        setError(`Lab closed for ${block.reason}. Please select another date.`);
        setFormData({ ...formData, date: '' });
        return;
      }
    }

    setError('');
    setFormData({ ...formData, date: selectedDate });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col border border-slate-200">
        <div className="bg-gradient-to-r from-clinical-rose to-clinical-rose-dark px-10 py-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Clinical Scheduler</h2>
            <p className="text-xs font-bold text-rose-100 uppercase tracking-widest mt-1">Diagnostic Intake V2</p>
          </div>
          <button onClick={onCancel} className="text-white hover:text-rose-200 transition-colors p-2 hover:bg-white/10 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 overflow-y-auto">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mb-6 bg-[#E11D48] border-2 border-rose-600 p-5 rounded-2xl flex items-center gap-3 text-white font-black text-sm shadow-2xl shadow-rose-900/50"
            >
              <AlertTriangle size={20} className="text-white flex-shrink-0" />
              <span className="text-white">{error}</span>
            </motion.div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h3 className="font-black text-xl mb-6 tracking-tight text-slate-900 uppercase">Review Selected Tests</h3>
              {selectedTests.map(t => (
                <div key={t._id} className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border-2 border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-clinical-rose text-lg">₹{t.price}</span>
                    <button onClick={() => onTestRemove(t)} className="text-slate-400 hover:text-clinical-rose p-2 rounded-full hover:bg-clinical-rose-light transition-all">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t-2 border-slate-200 pt-8 mt-10 flex justify-between items-center">
                <span className="text-xl font-black text-slate-900">Base Estimate</span>
                <p className="text-4xl font-black text-clinical-rose tracking-tighter">₹{baseTotal}</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <div className="flex items-center gap-4 p-5 bg-clinical-rose-light rounded-2xl mb-4 border-2 border-clinical-rose/20">
                <UserPlus className="text-clinical-rose" size={20} />
                <span className="text-sm font-bold text-slate-900">Booking for someone else?</span>
                <input
                  type="checkbox"
                  className="ml-auto w-5 h-5 accent-clinical-rose"
                  checked={!isBookingForSelf}
                  onChange={() => setIsBookingForSelf(!isBookingForSelf)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-600 mb-3">Patient Name</label>
                  <input className={inputStyles} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-600 mb-3">Contact Number</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-500">+91</span>
                    <input className={`${inputStyles} pl-16`} value={formData.phone} maxLength={10} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} placeholder="10 digits" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-600 mb-3">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input className={`${inputStyles} pl-16`} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="For report delivery (Optional)" readOnly={isBookingForSelf} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-600 mb-3">Referred By</label>
                <input className={inputStyles} value={formData.referredBy} onChange={e => setFormData({ ...formData, referredBy: e.target.value })} placeholder="e.g., Dr. Smith or Self" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div className="flex gap-4">
                {[CollectionType.LAB_VISIT, CollectionType.HOME].map(type => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, collectionType: type })}
                    className={`flex-1 p-8 rounded-2xl border-2 transition-all text-left ${formData.collectionType === type ? 'border-clinical-rose bg-clinical-rose-light shadow-rose' : 'border-slate-200 bg-slate-50'}`}
                  >
                    <span className={`block font-black text-xl mb-2 ${formData.collectionType === type ? 'text-clinical-rose' : 'text-slate-900'}`}>{type === CollectionType.HOME ? 'Home Dispatch' : 'Lab Visit'}</span>
                    <span className={`text-xs font-bold uppercase tracking-widest ${formData.collectionType === type ? 'text-clinical-rose-dark' : 'text-slate-600'}`}>{type === CollectionType.HOME ? 'Collection at site' : 'Visit Link Road'}</span>
                  </button>
                ))}
              </div>

              {formData.collectionType === CollectionType.HOME && (
                <div className="space-y-6">
                  <button
                    type="button"
                    onClick={captureLocation}
                    disabled={isCapturingLocation}
                    className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-wider transition-all border-2 ${formData.coordinates
                      ? 'bg-success/10 text-success border-success'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                  >
                    {isCapturingLocation ? <Loader2 className="animate-spin" /> : formData.coordinates ? <CheckCircle size={20} /> : <Navigation size={20} />}
                    {formData.coordinates ? 'Location Synced' : 'Sync Current Location'}
                  </button>
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, coordinates: { lat: 21.9000, lng: 77.9000 } }))} // Close to lab
                      className="text-xs text-slate-400 hover:text-clinical-rose underline text-center w-full block"
                    >
                      [DEV] Use Mock Location (Betul)
                    </button>
                  )}
                  <textarea
                    className={`${inputStyles} h-32`}
                    placeholder="Full Address & Landmarks..."
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-600 mb-3">Date</label>
                  <input type="date" className={inputStyles} value={formData.date} onChange={handleDateChange} min={getTodayDate()} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-600 mb-3">Time Slot</label>
                  <select className={inputStyles} value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}>
                    <option value="">Select Time Slot</option>
                    <option>08:00 AM - 10:00 AM</option>
                    <option>10:00 AM - 12:00 PM</option>
                    <option>12:00 PM - 04:00 PM</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 text-center">
              <div className="bg-gradient-to-br from-clinical-rose-light to-white p-10 rounded-3xl border-2 border-clinical-rose/20">
                <p className="text-slate-600 uppercase font-black tracking-widest text-xs mb-2">Final Amount</p>
                <p className="text-6xl font-black tracking-tighter text-clinical-rose">₹{finalTotal}</p>
                {discount > 0 && <p className="text-sm font-bold text-success mt-2 uppercase">Promo Applied (-₹{discount})</p>}
              </div>

              <div className="flex gap-4 p-5 bg-slate-50 rounded-2xl border-2 border-slate-200">
                <Ticket className="text-clinical-rose" size={20} />
                <input
                  placeholder="Coupon Code"
                  className="bg-transparent border-0 outline-none font-bold text-slate-900 flex-1 uppercase placeholder:text-slate-400"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value)}
                />
                <button
                  onClick={applyPromo}
                  disabled={isValidatingCoupon}
                  className="text-clinical-rose font-black text-sm uppercase hover:text-clinical-rose-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isValidatingCoupon ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>

              {currentUser?.role !== 'patient' && (
                <div className="p-6 bg-slate-50 rounded-2xl text-left space-y-4 border-2 border-slate-200">
                  <div>
                    <label className="text-xs font-black uppercase text-slate-600 mb-2 block">Amount Paid Now (Cash/Partial)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="number"
                        className={`${inputStyles} pl-12`}
                        value={amountTaken}
                        onChange={(e) => setAmountTaken(Number(e.target.value))}
                        max={finalTotal}
                        disabled={paymentMethod === 'cash'}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
                    <span className="font-bold text-sm text-slate-600">Balance Due:</span>
                    <span className="font-black text-clinical-rose text-xl">₹{balanceAmount}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <button onClick={() => setPaymentMethod('online')} className={`p-6 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'online' ? 'border-clinical-rose bg-clinical-rose-light shadow-rose' : 'border-slate-200 bg-white'}`}>
                  <p className={`font-black uppercase text-sm mb-1 ${paymentMethod === 'online' ? 'text-clinical-rose' : 'text-slate-900'}`}>Online</p>
                  <p className={`text-xs font-bold uppercase ${paymentMethod === 'online' ? 'text-clinical-rose-dark' : 'text-slate-600'}`}>UPI / Card</p>
                </button>
                <button onClick={() => setPaymentMethod('cash')} className={`p-6 rounded-2xl border-2 transition-all text-left ${paymentMethod === 'cash' ? 'border-clinical-rose bg-clinical-rose-light shadow-rose' : 'border-slate-200 bg-white'}`}>
                  <p className={`font-black uppercase text-sm mb-1 ${paymentMethod === 'cash' ? 'text-clinical-rose' : 'text-slate-900'}`}>Cash</p>
                  <p className={`text-xs font-bold uppercase ${paymentMethod === 'cash' ? 'text-clinical-rose-dark' : 'text-slate-600'}`}>Pay at Lab</p>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-10 py-8 border-t-2 border-slate-200 flex justify-between items-center">
          <button disabled={step === 1} onClick={prevStep} className="font-black text-sm uppercase tracking-widest text-slate-500 hover:text-clinical-rose disabled:opacity-30 transition-colors">Back</button>
          {step < 4 ? (
            <button onClick={nextStep} className="bg-clinical-rose text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-rose-lg hover:bg-clinical-rose-dark transition-all">Continue</button>
          ) : (
            <button onClick={handleSubmit} className="bg-clinical-rose text-white px-16 py-6 rounded-2xl font-black text-base uppercase tracking-wider shadow-rose-lg hover:bg-clinical-rose-dark transition-all">Confirm Booking</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;