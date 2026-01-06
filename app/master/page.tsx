'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Calendar, Lock, Trash2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [config, setConfig] = useState<any>(null);
    const [blackouts, setBlackouts] = useState<any[]>([]);
    const [newBlackout, setNewBlackout] = useState({ reason: '', startDate: '', endDate: '' });
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
            const [sRes, bRes] = await Promise.all([
                fetch('/api/settings'),
                fetch('/api/settings/blackout-dates')
            ]);
            if (sRes.ok) setConfig(await sRes.json());
            if (bRes.ok) setBlackouts(await bRes.json());
        } catch (e) { toast.error("Load failed"); } finally { setLoading(false); }
    };

    const handleUpdate = async (updates: any) => {
        setConfig({ ...config, ...updates });
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            if (res.ok) toast.success("Settings Sync Success");
        } catch (e) { toast.error("Sync failed"); fetchData(); }
    };

    const addBlackout = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/settings/blackout-dates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBlackout)
        });
        if (res.ok) {
            setNewBlackout({ reason: '', startDate: '', endDate: '' });
            fetchData();
            toast.success("Blackout added");
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex justify-between items-center border-b border-slate-700 pb-6">
                    <h1 className="text-3xl font-black flex items-center gap-3"><ShieldCheck className="text-purple-500" /> MASTER CONTROL</h1>
                    <button onClick={() => router.push('/admin')} className="bg-slate-700 px-4 py-2 rounded-lg font-bold">Go to Lab View</button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* SaaS Gating */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
                        <h2 className="font-black text-purple-400 flex items-center gap-2"><Lock size={18} /> SaaS Gating</h2>
                        <div className="space-y-3">
                            {['allowWhatsApp', 'allowSundayBookings'].map(flag => (
                                <label key={flag} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                                    <span className="text-sm font-bold">{flag}</span>
                                    <input type="checkbox" checked={config.planFlags?.[flag]} onChange={(e) => handleUpdate({ planFlags: { ...config.planFlags, [flag]: e.target.checked } })} />
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Security Defaults */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
                        <h2 className="font-black text-blue-400 flex items-center gap-2"><KeyRound size={18} /> Security & OTP</h2>
                        <label className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                            <span className="text-sm font-bold">Require OTP Signup</span>
                            <input type="checkbox" checked={config.requireVerification} onChange={(e) => handleUpdate({ requireVerification: e.target.checked })} />
                        </label>
                        <p className="text-[10px] text-slate-400">Controls if patients must verify email/phone during registration.</p>
                    </div>

                    {/* Blackout Dates */}
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4 md:row-span-2">
                        <h2 className="font-black text-amber-400 flex items-center gap-2"><Calendar size={18} /> Lab Blackouts</h2>
                        <form onSubmit={addBlackout} className="space-y-2">
                            <input className="w-full bg-slate-900 p-2 rounded text-xs" placeholder="Reason" value={newBlackout.reason} onChange={e => setNewBlackout({ ...newBlackout, reason: e.target.value })} required />
                            <input type="date" className="w-full bg-slate-900 p-2 rounded text-xs" value={newBlackout.startDate} onChange={e => setNewBlackout({ ...newBlackout, startDate: e.target.value })} required />
                            <input type="date" className="w-full bg-slate-900 p-2 rounded text-xs" value={newBlackout.endDate} onChange={e => setNewBlackout({ ...newBlackout, endDate: e.target.value })} required />
                            <button className="w-full bg-purple-600 py-2 rounded font-bold text-xs">Add Block</button>
                        </form>
                        <div className="space-y-2 max-h-64 overflow-auto">
                            {blackouts.map((b: any) => (
                                <div key={b._id} className="flex justify-between bg-slate-700/30 p-2 rounded text-[10px]">
                                    <span>{b.reason}</span>
                                    <button onClick={async () => { await fetch(`/api/settings/blackout-dates?id=${b._id}`, { method: 'DELETE' }); fetchData(); }}><Trash2 size={12} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
