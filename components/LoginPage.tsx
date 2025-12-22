
import React, { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, ArrowLeft, Eye, EyeOff, ShieldCheck, HeartHandshake, User as UserIcon, Check } from 'lucide-react';
import { User } from '../types'; // Assuming User type has a token field
import Link from 'next/link'; // Import Link component

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Assuming the API returns user data including a token
      // For now, storing in localStorage. Ideally, use HttpOnly cookies.
      localStorage.setItem('pawar_lab_auth_token', data.token); // Store the token
      localStorage.setItem('pawar_lab_user_role', data.role); // Store user role
      
      // Pass the user object to onLoginSuccess
      onLoginSuccess(data.user); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-5xl bg-[#111112] rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 overflow-hidden flex flex-col lg:flex-row relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Left Side: Immersive Info */}
        <div className="lg:w-1/2 bg-gradient-to-br from-red-600 to-red-900 p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          
          <div className="relative z-10">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-red-100 hover:text-white font-bold transition-all mb-12"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Home
            </button>
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
              <UserIcon className="text-red-600 w-10 h-10" /> {/* Changed from FlaskConical to UserIcon, as FlaskConical was likely a placeholder and UserIcon is more generic for login */}
            </div>
            <h1 className="font-heading text-4xl font-black text-white leading-tight mb-4">
              Diagnostic <br />Intelligence <br />Center
            </h1>
            <p className="text-red-100/70 font-medium max-w-xs">
              Access the high-performance management dashboard of Betul's premium pathology ecosystem.
            </p>
          </div>

          <div className="relative z-10 pt-12 border-t border-white/10">
            <div className="flex items-center gap-4 text-white font-bold">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-red-200">Security Standard</p>
                <p>HIPAA & NABL Compliant</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:w-1/2 p-12 md:p-16 flex flex-col justify-center">
          <div className="mb-12">
            <h2 className="text-2xl font-black text-white mb-2">Portal Access</h2>
            <p className="text-gray-500 text-sm font-medium">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-500">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-xs font-bold leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input 
                  type="text" 
                  required
                  placeholder="Username"
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-red-500 focus:bg-white/10 outline-none transition-all font-bold text-white text-sm"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                <input 
                  type={showPassword ? 'text' : 'password'} // Dynamic type
                  required
                  placeholder="Password"
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-2xl focus:ring-2 focus:ring-red-500 focus:bg-white/10 outline-none transition-all font-bold text-white text-sm"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={togglePasswordVisibility}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-red-700 shadow-2xl shadow-red-900/30 transition-all active:scale-95 disabled:opacity-70 mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Establish Session <ArrowLeft className="w-4 h-4 rotate-180" /></>
            </button>
            <p className="text-center text-gray-500 text-xs mt-4">
              Don't have an account? {' '}
              <Link href="/signup" className="text-red-500 hover:underline font-bold">
                Create one
              </Link>
            </p>
          </form>

          <p className="mt-12 text-center text-[9px] font-black text-gray-600 uppercase tracking-[0.5em]">
            Obsidian Cloud Security Verified
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
