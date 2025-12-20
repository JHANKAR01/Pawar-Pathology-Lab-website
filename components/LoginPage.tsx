
import React, { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, FlaskConical, ArrowLeft, ShieldCheck, HeartHandshake, User as UserIcon } from 'lucide-react';
import { mockApi } from '../lib/mockApi';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    const loginId = customId || email;
    const loginPass = customId || password;

    try {
      const user = await mockApi.login(loginId, loginPass);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogins = [
    { id: 'admin', label: 'Admin', icon: ShieldCheck, color: 'hover:bg-red-50 hover:text-red-600' },
    { id: 'partner', label: 'Partner', icon: HeartHandshake, color: 'hover:bg-blue-50 hover:text-blue-600' },
    { id: 'user', label: 'User', icon: UserIcon, color: 'hover:bg-green-50 hover:text-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-red-600 font-bold transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Back to Website
      </button>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-red-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <FlaskConical className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Portal Access</h2>
          <p className="text-red-100 text-xs font-medium mt-1">Select account or enter credentials</p>
        </div>

        <div className="px-10 pt-8">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Quick Toggle Login</label>
          <div className="grid grid-cols-3 gap-3">
            {quickLogins.map(role => (
              <button
                key={role.id}
                onClick={() => handleLogin(undefined, role.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-100 transition-all font-bold text-xs text-gray-500 ${role.color}`}
              >
                <role.icon className="w-5 h-5" />
                {role.label}
              </button>
            ))}
          </div>
          <div className="relative flex items-center py-8">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">or</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>
        </div>

        <form onSubmit={handleLogin} className="px-10 pb-10 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-600 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs font-bold leading-relaxed">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">User ID / Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              <input 
                type="text" 
                required
                placeholder="Enter ID"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all font-medium text-sm"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none transition-all font-medium text-sm"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all shadow-xl active:scale-95 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
