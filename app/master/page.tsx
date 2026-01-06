'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, Calendar, Lock, Trash2, KeyRound, Map, Bell, Server, CloudCog, LogOut, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [config, setConfig] = useState<any>(null);
    const [blackouts, setBlackouts] = useState<any[]>([]);
    const [newBlackout, setNewBlackout] = useState({ reason: '', startDate: '', endDate: '' });
    const [loading, setLoading] = useState(true);
    const [provisioning, setProvisioning] = useState(false);

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

    const triggerProvisioning = async () => {
        if (!confirm("Confirm Provisioning Drive Folders?")) return;
        setProvisioning(true);
        try {
            const res = await fetch('/api/admin/provision-drive', { method: 'POST' });
            const data = await res.json();
            if (res.ok) toast.success(data.message || "Drive Provisioned");
            else toast.error("Provisioning Failed");
        } catch (e) { toast.error("Error connecting to API"); }
        finally { setProvisioning(false); }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-purple-500" /></div>;

    const Toggle = ({ label, field, subLabel = "" }: any) => (
        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
            <div>
                <p className="text-sm font-bold text-slate-200">{label}</p>
                {subLabel && <p className="text-[10px] text-slate-400 uppercase tracking-wider">{subLabel}</p>}
            </div>
            <button
                onClick={() => handleUpdate({ [field]: !config[field] })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config[field] ? 'bg-purple-500' : 'bg-slate-600'}`}
            >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config[field] ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800/50 p-6 rounded-3xl border border-slate-700 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-purple-600 rounded-2xl shadow-lg shadow-purple-500/20">
                            <ShieldCheck size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Master<span className="text-purple-400">Control</span></h1>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">System Override Panel</p>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* COL 1: Security & SaaS */}
                    <div className="space-y-6">
                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
                            <h2 className="font-black text-purple-400 flex items-center gap-2 text-lg"><Lock size={20} /> SaaS Gating</h2>
                            <div className="space-y-2">
                                {['allowWhatsApp', 'allowSundayBookings'].map(flag => (
                                    <div key={flag} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl border border-slate-600/30">
                                        <span className="text-xs font-bold font-mono text-slate-300">{flag}</span>
                                        <input
                                            type="checkbox"
                                            checked={config.planFlags?.[flag]}
                                            onChange={(e) => handleUpdate({ planFlags: { ...config.planFlags, [flag]: e.target.checked } })}
                                            className="w-4 h-4 rounded border-slate-500 text-purple-600 focus:ring-purple-500/50 bg-slate-700"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
                            <h2 className="font-black text-blue-400 flex items-center gap-2 text-lg"><KeyRound size={20} /> Security Defaults</h2>
                            <Toggle label="Require OTP" field="requireVerification" subLabel="Patient Email/Phone Verification" />
                        </div>

                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
                            <h2 className="font-black text-rose-400 flex items-center gap-2 text-lg"><Server size={20} /> Maintenance</h2>
                            <Toggle label="Full Lockdown" field="maintenanceMode" subLabel="Stop All Access" />
                            <Toggle label="Patient Portal" field="maintenanceModeUser" subLabel="Block Patients" />
                            <Toggle label="Partner Portal" field="maintenanceModePartner" subLabel="Block Partners" />
                        </div>
                    </div>

                    {/* COL 2: Notifications & Logistics */}
                    <div className="space-y-6">
                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
                            <h2 className="font-black text-emerald-400 flex items-center gap-2 text-lg"><Bell size={20} /> Notification Hub</h2>
                            <Toggle label="SMS Gateway" field="smsEnabled" />
                            <Toggle label="Email Gateway" field="emailEnabled" />
                            <div className="h-px bg-slate-700 my-2" />
                            <Toggle label="WhatsApp" field="whatsappEnabled" />
                            {config.whatsappEnabled && <Toggle label="Official API" field="whatsappOfficialEnabled" subLabel="Use Cloud API" />}
                            <div className="h-px bg-slate-700 my-2" />
                            <Toggle label="Telegram Bot" field="telegramEnabled" />

                            {config.telegramEnabled && (
                                <div className="space-y-3 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                                    <input
                                        type="text"
                                        placeholder="Admin Chat ID"
                                        value={config.telegramAdminChatId || ''}
                                        onChange={(e) => handleUpdate({ telegramAdminChatId: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs font-mono"
                                    />
                                    <div className="grid grid-cols-3 gap-2">
                                        {['telegramEnabledAdmin', 'telegramEnabledPartner', 'telegramEnabledUser'].map(tField => (
                                            <label key={tField} className="flex flex-col items-center gap-1 cursor-pointer bg-slate-800 p-2 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{tField.replace('telegramEnabled', '')}</span>
                                                <input type="checkbox" checked={config[tField]} onChange={(e) => handleUpdate({ [tField]: e.target.checked })} className="rounded text-purple-600 focus:ring-0 bg-slate-700 border-slate-500" />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
                            <h2 className="font-black text-amber-400 flex items-center gap-2 text-lg"><Map size={20} /> Logistics</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <Toggle label="Geo-Fencing" field="locationFencingEnabled" />
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Distance Type</p>
                                    <select
                                        value={config.distanceType}
                                        onChange={(e) => handleUpdate({ distanceType: e.target.value })}
                                        className="w-full mt-1 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-xs"
                                    >
                                        <option value="displacement">Straight Line</option>
                                        <option value="road">Road Network</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Service Radius (KM)</p>
                                <input
                                    type="number"
                                    value={config.serviceRadius}
                                    onChange={(e) => handleUpdate({ serviceRadius: Number(e.target.value) })}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm font-black text-center"
                                />
                            </div>
                        </div>
                    </div>

                    {/* COL 3: Operations & Blackouts */}
                    <div className="space-y-6">
                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <CloudCog size={100} />
                            </div>
                            <h2 className="font-black text-sky-400 flex items-center gap-2 text-lg relative z-10"><Server size={20} /> Infrastructure</h2>

                            <button
                                onClick={triggerProvisioning}
                                disabled={provisioning}
                                className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl uppercase tracking-widest text-xs shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all relative z-10"
                            >
                                {provisioning ? <Loader2 className="animate-spin mx-auto" /> : 'Provision Drive Folders'}
                            </button>
                            <p className="text-[10px] text-slate-400 text-center relative z-10">Manually trigger monthly folder structure creation.</p>
                        </div>

                        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4 flex-1">
                            <h2 className="font-black text-pink-400 flex items-center gap-2 text-lg"><Calendar size={20} /> Lab Blackouts</h2>
                            <form onSubmit={addBlackout} className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                <input className="w-full bg-slate-800 border border-slate-600 p-2 rounded-lg text-xs" placeholder="Reason (e.g. Holiday)" value={newBlackout.reason} onChange={e => setNewBlackout({ ...newBlackout, reason: e.target.value })} required />
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="date" className="bg-slate-800 border border-slate-600 p-2 rounded-lg text-xs" value={newBlackout.startDate} onChange={e => setNewBlackout({ ...newBlackout, startDate: e.target.value })} required />
                                    <input type="date" className="bg-slate-800 border border-slate-600 p-2 rounded-lg text-xs" value={newBlackout.endDate} onChange={e => setNewBlackout({ ...newBlackout, endDate: e.target.value })} required />
                                </div>
                                <button className="w-full bg-pink-600 hover:bg-pink-500 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors">Add Blackout</button>
                            </form>
                            <div className="space-y-2 max-h-[300px] overflow-auto pr-1 custom-scrollbar">
                                {blackouts.map((b: any) => (
                                    <div key={b._id} className="flex items-center justify-between bg-slate-700/30 p-3 rounded-xl border border-slate-700/50 group hover:border-pink-500/50 transition-colors">
                                        <div>
                                            <p className="text-xs font-bold text-slate-200">{b.reason}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            onClick={async () => { await fetch(`/api/settings/blackout-dates?id=${b._id}`, { method: 'DELETE' }); fetchData(); }}
                                            className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                {blackouts.length === 0 && <p className="text-center text-xs text-slate-600 font-bold py-4">No active blackout dates.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
