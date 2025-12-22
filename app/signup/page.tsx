'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, Loader2, AlertCircle, FlaskConical, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, phone, password }),
      });

      if (response.ok) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-5xl bg-[#111112] rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden flex flex-col lg:flex-row relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="lg:w-1/2 bg-gradient-to-br from-red-600 to-red-900 p-12 flex flex-col justify-center gap-16 relative overflow-hidden">
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl mx-auto">
              <FlaskConical className="text-red-600 w-10 h-10" />
            </div>
            <h1 className="font-heading text-4xl font-black text-white leading-tight mb-4">
              Join the Future of Diagnostics
            </h1>
            <p className="text-red-100 font-medium">Create your secure account</p>
          </div>
          <div className="relative z-10">
            <button onClick={() => router.push('/')} className="w-full flex items-center justify-center gap-3 text-red-100 hover:text-white font-bold px-6 py-4 rounded-[2rem] bg-white/10">
              <ArrowLeft className="w-5 h-5" /> Go back to Homepage
            </button>
          </div>
        </div>

        <div className="lg:w-1/2 p-12 md:p-16 flex flex-col justify-center">
          <div className="mb-12">
            <h2 className="text-2xl font-black text-white mb-2">Create Account</h2>
            <p className="text-gray-500 text-sm font-medium">Enter your details to register.</p>
          </div>

          {(error || success) && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${error ? 'bg-red-900/50 border-red-500/50 text-red-300' : 'bg-green-900/50 border-green-500/50 text-green-300'}`}>
              <AlertCircle size={20} />
              <span className="font-bold">{error || success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl outline-none text-white font-bold" />
            </div>
            {/* Username */}
            <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl outline-none text-white font-bold" />
            </div>
            {/* Email */}
            <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl outline-none text-white font-bold" />
            </div>
            {/* Phone */}
            <div className="relative">
                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl outline-none text-white font-bold" />
            </div>
            {/* Password */}
            <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full pl-16 pr-16 py-5 bg-white/5 border border-white/5 rounded-2xl outline-none text-white font-bold" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-rose-500">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            {/* Confirm Password */}
            <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full pl-16 pr-16 py-5 bg-white/5 border border-white/5 rounded-2xl outline-none text-white font-bold" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-rose-500">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            
            <div className="pt-4 space-y-4">
              <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-red-700 transition-all" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
              </button>
              <button type="button" onClick={() => router.push('/login')} className="w-full bg-transparent border-2 border-white/20 text-white/70 py-5 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 hover:text-white transition-all">
                Already have an account? Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}