'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

export default function CookieBanner() {
    const [consent, setConsent] = useState<'pending' | 'accepted' | 'rejected'>('pending');

    useEffect(() => {
        const saved = localStorage.getItem('cookie_consent');
        if (saved === 'accepted' || saved === 'rejected') {
            setConsent(saved as any);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setConsent('accepted');
        // Here you would initialize Analytics/GTM
        window.dispatchEvent(new Event('cookie_consent_updated'));
    };

    const handleReject = () => {
        localStorage.setItem('cookie_consent', 'rejected');
        setConsent('rejected');
    };

    if (consent !== 'pending') return null;

    return (
        <div className="fixed bottom-0 left-0 w-full z-[100] p-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-5xl mx-auto bg-slate-900/95 backdrop-blur-md text-white p-6 rounded-3xl shadow-2xl border border-slate-700 flex flex-col md:flex-row items-center gap-6 justify-between">

                <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-800 rounded-xl">
                        <Cookie className="text-amber-400 w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-1">We value your privacy</h3>
                        <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                            We use cookies to enhance your experience and analyze traffic. Since we handle sensitive health data, we strictly follow our <Link href="/privacy-policy" className="text-clinical-rose hover:text-white underline transition-colors">Privacy Policy</Link>.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={handleReject}
                        className="flex-1 md:flex-none px-6 py-3 border border-slate-600 rounded-xl hover:bg-slate-800 transition-colors font-bold text-sm text-slate-300"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="flex-1 md:flex-none px-8 py-3 bg-clinical-rose hover:bg-clinical-rose-dark rounded-xl transition-colors font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-900/20"
                    >
                        Accept Cookies
                    </button>
                </div>
            </div>
        </div>
    );
}
