'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, Loader2, AlertCircle, FlaskConical, ArrowLeft, Eye, EyeOff, ShieldCheck, Timer } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Details, 2: OTP

  // Step 1 State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2 State
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Common State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handlers
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    // Pre-validation
    if (step === 1) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });

      const data = await res.json();

      if (res.ok) {
        setStep(2);
        setCooldown(60); // 60s cooldown
        startCooldown();
        toast.success("OTP sent to your email!");
        setError('');
      } else {
        setError(data.error || "Failed to send OTP.");
        toast.error(data.error || "Failed to send OTP.");
      }
    } catch (e) {
      setError("An unpredictable error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, otp })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Account created successfully!");
        router.push('/login');
      } else {
        const msg = data.error || "Signup failed.";
        setError(msg);
        toast.error(msg);
      }
    } catch (e) {
      setError("Network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const startCooldown = () => {
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-clinical-rose-light/30 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-clinical-rose rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-clinical-rose/50 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col lg:flex-row relative z-10 animate-in fade-in zoom-in duration-500">

        <div className="lg:w-1/2 bg-gradient-to-br from-clinical-rose to-clinical-rose-dark p-12 flex flex-col justify-center gap-16 relative overflow-hidden">
          <div className="relative z-10 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl mx-auto">
              <FlaskConical className="text-clinical-rose w-12 h-12" />
            </div>
            <h1 className="font-heading text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              Join the Future of Diagnostics
            </h1>
            <p className="text-rose-100 font-medium text-lg">Create your secure account</p>
          </div>
          <div className="relative z-10">
            <button onClick={() => router.push('/')} className="w-full flex items-center justify-center gap-3 text-white hover:text-rose-100 font-bold px-6 py-4 rounded-2xl bg-white/20 hover:bg-white/30 transition-all">
              <ArrowLeft className="w-5 h-5" /> Go back to Homepage
            </button>
          </div>
        </div>

        <div className="lg:w-1/2 p-12 md:p-16 flex flex-col justify-center bg-white">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {step === 1 ? 'Create Account' : 'Verify Email'}
            </h2>
            <p className="text-slate-600 text-base font-medium">
              {step === 1 ? 'Enter your details to register.' : `Enter the OTP sent to ${email}`}
            </p>
          </div>

          {(error) && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 border-2 bg-clinical-rose/10 border-clinical-rose text-clinical-rose`}>
              <AlertCircle size={20} />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              {/* Step 1 Fields */}
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all placeholder:text-slate-400" />
              </div>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all placeholder:text-slate-400" />
              </div>
              <div className="relative">
                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all placeholder:text-slate-400" />
              </div>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-16 pr-16 py-5 bg-white border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all placeholder:text-slate-400" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-clinical-rose hover:text-clinical-rose-dark transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full pl-16 pr-16 py-5 bg-white border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all placeholder:text-slate-400" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-clinical-rose hover:text-clinical-rose-dark transition-colors">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="pt-4 space-y-4">
                <button type="submit" className="w-full bg-clinical-rose text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-clinical-rose-dark transition-all shadow-rose-lg disabled:opacity-50" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Send OTP"}
                </button>
                <button type="button" onClick={() => router.push('/login')} className="w-full bg-transparent border-2 border-slate-300 text-slate-700 py-5 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-clinical-rose hover:text-clinical-rose transition-all">
                  Already have an account? Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndSignup} className="space-y-6">
              {/* Step 2 Inputs */}
              <div className="relative">
                <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={e => {
                    // Allow only numbers and max 6 digits
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                  }}
                  required
                  className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold text-2xl tracking-[0.5em] text-center focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all placeholder:text-slate-300 placeholder:tracking-normal"
                />
              </div>

              <div className="flex justify-between items-center text-sm font-bold">
                <button type="button" onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-700">change email</button>
                {cooldown > 0 ? (
                  <span className="text-slate-400 flex items-center gap-1"><Timer size={14} /> Resend in {cooldown}s</span>
                ) : (
                  <button type="button" onClick={() => handleSendOTP()} className="text-clinical-rose hover:underline" disabled={isLoading}>Resend OTP</button>
                )}
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-lg disabled:opacity-50" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Verify & Complete Registration"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}