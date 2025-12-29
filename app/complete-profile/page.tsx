'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, FlaskConical, CheckCircle } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      const token = localStorage.getItem('pawar_lab_auth_token');
      if (!token) {
        router.push('/login');
      }
    }
    if (status === 'authenticated' && !(session as any)?.needsProfileCompletion) {
        router.push('/');
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!phone.trim() || !address.trim()) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
      // Update user profile via API
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, address }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const { token, user } = await response.json();
      
      // Store token and user data
      document.cookie = `pawar_lab_auth_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      localStorage.setItem('pawar_lab_auth_token', token);
      localStorage.setItem('pawar_lab_user_role', user.role);
      localStorage.setItem('pawar_lab_user', JSON.stringify(user));

      // Hard redirect to refresh session state
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile');
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-clinical-rose animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-clinical-rose-light/30 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-12">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-clinical-rose rounded-3xl flex items-center justify-center mb-6 shadow-rose-lg mx-auto">
            <FlaskConical className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-3">Complete Your Profile</h1>
          <p className="text-slate-600 font-medium">
            We need a few more details to complete your registration
          </p>
        </div>

        {error && (
          <div className="bg-clinical-rose/10 border-2 border-clinical-rose text-clinical-rose p-4 rounded-xl mb-6">
            <span className="font-bold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Phone Number <span className="text-clinical-rose">*</span>
            </label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all placeholder:text-slate-400"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Address <span className="text-clinical-rose">*</span>
            </label>
            <textarea
              placeholder="Enter your complete address"
              rows={4}
              className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl outline-none text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all placeholder:text-slate-400 resize-none"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-clinical-rose text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-clinical-rose-dark transition-all shadow-rose-lg disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Completing Profile...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Complete Registration
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}