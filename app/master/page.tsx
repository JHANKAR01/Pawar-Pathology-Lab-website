'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated' || session?.user?.role !== 'master') {
            router.push('/login');
            return;
        }
        fetchConfig();
    }, [status, session]);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                setConfig(await res.json());
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleTogglePlan = async (key: string, value: boolean) => {
        // Optimistic Update
        const newFlags = { ...config.planFlags, [key]: value };
        setConfig({ ...config, planFlags: newFlags });

        // Auto-save logic
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planFlags: newFlags })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Plan updated successfully");
        } catch (e) {
            toast.error("Failed to update plan");
            fetchConfig(); // Revert
        } finally {
            setSaving(false);
        }
    };

    const handleConfigUpdate = async (key: string, value: any) => {
        // Optimistic Update
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);

        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Setting updated");
        } catch (e) {
            toast.error("Update failed");
            fetchConfig(); // Revert
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    if (!config) return null;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-12 border-b border-slate-700 pb-8">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">MASTER<span className="text-purple-500">CONTROL</span></h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">SaaS Infrastructure Management</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            Standard Plan Features
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                                <div>
                                    <h3 className="font-bold text-lg">Allow Sunday Bookings</h3>
                                    <p className="text-slate-400 text-sm">Can the lab operate on weekends?</p>
                                </div>
                                <div className="relative inline-block w-14 h-8 transition duration-200 ease-in-out">
                                    <input
                                        type="checkbox"
                                        className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                        checked={config.planFlags?.allowSundayBookings ?? false}
                                        onChange={(e) => handleTogglePlan('allowSundayBookings', e.target.checked)}
                                    />
                                    <label className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${config.planFlags?.allowSundayBookings ? 'bg-purple-600' : 'bg-slate-600'}`}></label>
                                    <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${config.planFlags?.allowSundayBookings ? 'translate-x-6' : '0'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            Premium Plan Features
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                                <div>
                                    <h3 className="font-bold text-lg">WhatsApp Integration</h3>
                                    <p className="text-slate-400 text-sm">Unlock cloud API messaging</p>
                                </div>
                                <div className="relative inline-block w-14 h-8 transition duration-200 ease-in-out">
                                    <input
                                        type="checkbox"
                                        className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                        checked={config.planFlags?.allowWhatsApp ?? false}
                                        onChange={(e) => handleTogglePlan('allowWhatsApp', e.target.checked)}
                                    />
                                    <label className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${config.planFlags?.allowWhatsApp ? 'bg-purple-600' : 'bg-slate-600'}`}></label>
                                    <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${config.planFlags?.allowWhatsApp ? 'translate-x-6' : '0'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-slate-800 rounded-3xl p-8 border border-slate-700">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        System Defaults
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                            <h3 className="font-bold text-lg mb-2">Service Radius (km)</h3>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                                value={config.serviceRadius || 0}
                                onChange={(e) => handleConfigUpdate('serviceRadius', parseFloat(e.target.value))}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                            <div>
                                <h3 className="font-bold text-lg">SMS Enabled</h3>
                                <p className="text-slate-400 text-sm">Global SMS Toggle</p>
                            </div>
                            <div className="relative inline-block w-14 h-8 transition duration-200 ease-in-out">
                                <input
                                    type="checkbox"
                                    className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                    checked={config.smsEnabled ?? false}
                                    onChange={(e) => handleConfigUpdate('smsEnabled', e.target.checked)}
                                />
                                <label className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${config.smsEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}></label>
                                <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${config.smsEnabled ? 'translate-x-6' : '0'}`}></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                            <div>
                                <h3 className="font-bold text-lg text-red-400">Maintenance Mode</h3>
                                <p className="text-slate-400 text-sm">Shut down booking system</p>
                            </div>
                            <div className="relative inline-block w-14 h-8 transition duration-200 ease-in-out">
                                <input
                                    type="checkbox"
                                    className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                    checked={config.maintenanceMode ?? false}
                                    onChange={(e) => handleConfigUpdate('maintenanceMode', e.target.checked)}
                                />
                                <label className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${config.maintenanceMode ? 'bg-red-500' : 'bg-slate-600'}`}></label>
                                <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${config.maintenanceMode ? 'translate-x-6' : '0'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-12 p-8 bg-slate-800 rounded-3xl border border-slate-700 text-center">
                    <p className="text-slate-400 mb-4">You are logged in as the System Master. Changes made here override all Admin settings.</p>
                    <button onClick={() => router.push('/admin')} className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                        Go to Admin View
                    </button>
                </div>
            </div>
        </div>
    );
}
