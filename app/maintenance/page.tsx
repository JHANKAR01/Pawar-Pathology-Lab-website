'use client';

import React from 'react';
import { ShieldAlert, Phone, Mail } from 'lucide-react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center border-t-8 border-rose-600">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                    <ShieldAlert className="w-12 h-12 text-rose-600" />
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                    System Maintenance
                </h1>

                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                    We are currently updating our systems to provide you with even better precision diagnostics. The lab portal is temporarily unavailable.
                </p>

                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                    <p className="font-bold text-slate-800 mb-2">Estimated downtime</p>
                    <p className="text-rose-600 font-bold">Less than 60 minutes</p>
                </div>

                <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-sm font-bold text-slate-500">
                    <a href="tel:+919876543210" className="flex items-center gap-2 hover:text-rose-600 transition-colors">
                        <Phone size={16} />
                        +91 98765 43210
                    </a>
                    <span className="hidden md:inline text-slate-300">|</span>
                    <a href="mailto:support@pawarlab.com" className="flex items-center gap-2 hover:text-rose-600 transition-colors">
                        <Mail size={16} />
                        support@pawarlab.com
                    </a>
                </div>

                <div className="mt-12 text-xs uppercase tracking-widest text-slate-400">
                    Pawar Pathology Lab &copy; {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
}
