'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, AlertCircle, FlaskConical, ShieldCheck, HeartHandshake, User as UserIcon } from 'lucide-react';
import { mockApi } from '@/lib/mockApi';
import { UserRole } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await mockApi.login(username, password);
      
      switch (user.role) {
        case UserRole.ADMIN:
          router.push('/admin');
          break;
        case UserRole.PARTNER:
          router.push('/partner');
          break;
        case UserRole.PATIENT:
          router.push('/reports');
          break;
        default:
          router.push('/');
      }

    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
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
        
        <div className="lg:w-1/2 bg-gradient-to-br from-red-600 to-red-900 p-12 flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl mx-auto">
              <FlaskConical className="text-red-600 w-10 h-10" />
            </div>
            <h1 className="font-heading text-4xl font-black text-white leading-tight mb-4">
              Diagnostic Intelligence Center
            </h1>
            <p className="text-red-100 font-medium">Secure Access Portal</p>
          </div>
        </div>

        <div className="lg:w-1/2 p-12 md:p-16 flex flex-col justify-center">
          <div className="mb-12">
            <h2 className="text-2xl font-black text-white mb-2">System Login</h2>
            <p className="text-gray-500 text-sm font-medium">Enter your credentials to access your dashboard.</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-4 rounded-xl mb-6 flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl outline-none text-white font-bold" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl outline-none text-white font-bold" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
            </div>
            <button type="submit" className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-red-700 transition-all" disabled={isLoading}>
               {isLoading ? <Loader2 className="animate-spin" /> : "Access System"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
