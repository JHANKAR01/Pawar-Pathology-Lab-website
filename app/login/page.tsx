
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, AlertCircle, FlaskConical, ArrowLeft, ShieldCheck, HeartHandshake, User as UserIcon } from 'lucide-react';
import { mockApi } from '@/lib/mockApi';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Simulating Auth for the UI prototype - in production, use NextAuth
  const handleLogin = async (e?: React.FormEvent, role?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const targetRole = role || (email.includes('admin') ? 'admin' : email.includes('partner') ? 'partner' : 'patient');
      await mockApi.login(targetRole, targetRole);
      
      if (targetRole === 'admin') router.push('/admin');
      else if (targetRole === 'partner') router.push('/partner');
      else router.push('/');

    } catch (err) {
      setError('Login failed. Please try again.');
      console.error(err);
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
        
        <div className="lg:w-1/2 bg-gradient-to-br from-red-600 to-red-900 p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <Link href="/" className="flex items-center gap-2 text-red-100 hover:text-white font-bold transition-all mb-12">
              <ArrowLeft className="w-5 h-5" /> Back to Home
            </Link>
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
              <FlaskConical className="text-red-600 w-10 h-10" />
            </div>
            <h1 className="font-heading text-4xl font-black text-white leading-tight mb-4">
              Diagnostic <br />Intelligence <br />Center
            </h1>
          </div>
        </div>

        <div className="lg:w-1/2 p-12 md:p-16 flex flex-col justify-center">
          <div className="mb-12">
            <h2 className="text-2xl font-black text-white mb-2">Portal Access</h2>
            <p className="text-gray-500 text-sm font-medium">Select a quick role for the Demo</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-12">
            <button onClick={() => handleLogin(undefined, 'admin')} className="group flex flex-col items-center gap-3 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-red-500/50 transition-all text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-red-500"><ShieldCheck /></div>
              <p className="text-white font-black text-[10px] uppercase">Admin</p>
            </button>
            <button onClick={() => handleLogin(undefined, 'partner')} className="group flex flex-col items-center gap-3 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-red-500/50 transition-all text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-red-500"><HeartHandshake /></div>
              <p className="text-white font-black text-[10px] uppercase">Partner</p>
            </button>
            <button onClick={() => handleLogin(undefined, 'patient')} className="group flex flex-col items-center gap-3 p-5 rounded-3xl bg-white/5 border border-white/5 hover:border-red-500/50 transition-all text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-red-500"><UserIcon /></div>
              <p className="text-white font-black text-[10px] uppercase">Patient</p>
            </button>
          </div>

          <form onSubmit={(e) => handleLogin(e)} className="space-y-6">
            <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input type="text" placeholder="Identity" className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl outline-none text-white font-bold" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-red-700 transition-all">
               {isLoading ? <Loader2 className="animate-spin" /> : "Access System"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
