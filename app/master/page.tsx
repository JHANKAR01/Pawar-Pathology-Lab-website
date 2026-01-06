'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, LogOut, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';

const PERMISSION_FLAGS = [
    { key: 'allowVerification', label: 'Patient Verification', description: 'OTP-based signup control' },
    { key: 'allowSmsEmail', label: 'SMS & Email Notifications', description: 'Gateway access for SMS/Email' },
    { key: 'allowSundayBookings', label: 'Sunday Operations', description: 'Enable/disable Sunday bookings' },
    { key: 'allowMaintenanceConfig', label: 'Maintenance Config', description: 'Portal lockdown controls' },
    { key: 'allowWhatsApp', label: 'WhatsApp Integration', description: 'WhatsApp messaging features' },
    { key: 'allowTelegram', label: 'Telegram Staff Alerts', description: 'Internal Telegram notifications' },
    { key: 'allowDriveInfrastructure', label: 'Google Drive Sync', description: 'Report storage infrastructure' },
    { key: 'allowGeofencing', label: 'Geographic Fencing', description: 'Location-based booking radius' },
    { key: 'allowBlackoutManagement', label: 'Clinical Calendar', description: 'Blackout date management' },
];

export default function MasterDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'master')) {
            router.push('/login');
        } else if (status === 'authenticated') {
            fetchData();
        }
    }, [status]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) setConfig(await res.json());
        } catch (e) { toast.error("Load failed"); } finally { setLoading(false); }
    };

    const handleToggle = async (key: string, value: boolean) => {
        const newPlanFlags = { ...config.planFlags, [key]: value };
        setConfig({ ...config, planFlags: newPlanFlags });
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planFlags: newPlanFlags })
            });
            if (res.ok) {
                toast.success(`${key.replace('allow', '')} ${value ? 'Enabled' : 'Disabled'}`);
                fetchData(); // Refresh to get cascaded changes
            } else {
                toast.error("Sync failed");
            }
        } catch (e) { toast.error("Sync failed"); fetchData(); }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-purple-500" size={40} /></div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/50 p-6 rounded-3xl border border-slate-700 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-purple-600 rounded-2xl shadow-lg shadow-purple-500/20">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">SaaS <span className="text-purple-400">Permissions</span></h1>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Master Control Panel</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/admin')}
                            className="flex items-center gap-2 px-5 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                        >
                            <LayoutDashboard size={16} /> Lab Management
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="flex items-center gap-2 px-5 py-3 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 border border-rose-600/30 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </header>

                {/* Permission Grid */}
                <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-2">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">
                        <span className="text-green-400">ON</span> = Feature Unlocked for Admin | <span className="text-red-400">OFF</span> = Feature Locked
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {PERMISSION_FLAGS.map(flag => (
                            <div
                                key={flag.key}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer ${config.planFlags?.[flag.key]
                                        ? 'bg-green-900/20 border-green-500/50 hover:bg-green-900/30'
                                        : 'bg-red-900/20 border-red-500/50 hover:bg-red-900/30'
                                    }`}
                                onClick={() => handleToggle(flag.key, !config.planFlags?.[flag.key])}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-sm text-slate-100">{flag.label}</h3>
                                        <p className="text-[10px] text-slate-400 mt-1">{flag.description}</p>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${config.planFlags?.[flag.key] ? 'bg-green-500' : 'bg-slate-600'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.planFlags?.[flag.key] ? 'translate-x-4' : ''}`} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Footer */}
                <div className="text-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Toggling a permission OFF will immediately cascade-disable the corresponding feature in the lab&apos;s configuration.
                </div>
            </div>
        </div>
    );
}
