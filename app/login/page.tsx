'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail, Lock, Loader2, AlertCircle, FlaskConical, ShieldCheck, HeartHandshake, User as UserIcon, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }
      
      // On successful sign-in, NextAuth handles the session.
      // Refresh the page to make sure the session is updated everywhere.
      router.refresh();
      // Then push to a default location; middleware will handle role-based redirects.
      router.push('/');

    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: true,
      });
      if (result?.error) {
        setError('Google sign-in failed. Please try again.');
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setIsGoogleLoading(false);
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
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500 font-bold uppercase">Or</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full bg-white border-2 border-slate-300 text-slate-700 py-5 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-clinical-rose hover:text-clinical-rose transition-all disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
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
