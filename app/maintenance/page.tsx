'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Phone, Clock, AlertTriangle } from 'lucide-react';

function MaintenanceContent() {
    const searchParams = useSearchParams();
    const type = searchParams.get('type') || 'patient';
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMessage = async () => {
            try {
                const res = await fetch('/api/maintenance/status');
                if (res.ok) {
                    const data = await res.json();
                    if (type === 'partner') {
                        setMessage(data.messagePartner || "Our Partner Portal is currently undergoing scheduled maintenance.");
                    } else {
                        setMessage(data.messageUser || "We are currently updating our systems to serve you better.");
                    }
                }
            } catch (e) {
                setMessage("System maintenance in progress.");
            } finally {
                setLoading(false);
            }
        };
        fetchMessage();
    }, [type]);

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background Pulse Effect */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"
            />

            <div className="relative z-10 max-w-lg w-full bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-10 rounded-3xl shadow-2xl">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-500/30"
                >
                    <Lock className="text-white w-10 h-10" />
                </motion.div>

                <h1 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">
                    {type === 'partner' ? 'Partner Portal Locked' : 'System Offline'}
                </h1>

                <div className="min-h-[60px]">
                    {loading ? (
                        <div className="h-4 w-3/4 bg-slate-700 rounded animate-pulse mx-auto"></div>
                    ) : (
                        <p className="text-slate-300 text-lg font-medium leading-relaxed">
                            {message}
                        </p>
                    )}
                </div>

                <div className="mt-10 flex flex-col gap-4">
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-center gap-4">
                        <div className="p-3 bg-slate-800 rounded-lg">
                            <Clock className="text-indigo-400" size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estimated Return</p>
                            <p className="text-slate-200 font-bold">Please check back shortly</p>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-center gap-4">
                        <div className="p-3 bg-slate-800 rounded-lg">
                            <Phone className="text-emerald-400" size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Emergency Contact</p>
                            <p className="text-slate-200 font-bold">+91 99999 99999</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Pawar Pathology Lab • IT Operations</p>
                </div>
            </div>
        </div>
    );
}

export default function MaintenancePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
            <MaintenanceContent />
        </Suspense>
    );
}
