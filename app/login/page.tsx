'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, AlertCircle, FlaskConical, ShieldCheck, HeartHandshake, User as UserIcon, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { token, user } = await response.json();
      
      localStorage.setItem('pawar_lab_auth_token', token);
      localStorage.setItem('pawar_lab_user_role', user.role);
      localStorage.setItem('pawar_lab_user', JSON.stringify(user));
      
      switch (user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'partner':
          router.push('/partner');
          break;
        case 'patient':
          router.push('/');
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
              Diagnostic Intelligence Center
            </h1>
            <p className="text-rose-100 font-medium text-lg">Secure Access Portal</p>
          </div>
          <div className="relative z-10">
            <button onClick={() => router.push('/')} className="w-full flex items-center justify-center gap-3 text-white hover:text-rose-100 font-bold px-6 py-4 rounded-2xl bg-white/20 hover:bg-white/30 transition-all">
              <ArrowLeft className="w-5 h-5" /> Go back to Homepage
            </button>
          </div>
        </div>

        <div className="lg:w-1/2 p-12 md:p-16 flex flex-col justify-center bg-white">
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-2">System Login</h2>
            <p className="text-slate-600 text-base font-medium">Enter your credentials to access your dashboard.</p>
          </div>

          {error && (
            <div className="bg-clinical-rose/10 border-2 border-clinical-rose text-clinical-rose p-4 rounded-xl mb-6 flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="w-full pl-16 pr-6 py-5 bg-white border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all placeholder:text-slate-400" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password" 
                  className="w-full pl-16 pr-16 py-5 bg-white border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all placeholder:text-slate-400" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-clinical-rose hover:text-clinical-rose-dark transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
            <div className="pt-4 space-y-4">
              <button type="submit" className="w-full bg-clinical-rose text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-clinical-rose-dark transition-all shadow-rose-lg disabled:opacity-50" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Establish Session"}
              </button>
              <button type="button" onClick={() => router.push('/signup')} className="w-full bg-transparent border-2 border-slate-300 text-slate-700 py-5 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-clinical-rose hover:text-clinical-rose transition-all">
                Register / Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
