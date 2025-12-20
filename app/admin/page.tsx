'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, FileText, HeartHandshake, Settings as SettingsIcon, 
  Bell, Search, ShieldCheck, LogOut, CheckCircle, Loader2, RefreshCw, Filter, 
  UserPlus, MapPin, ClipboardCheck, UserCheck, UserPlus2
} from 'lucide-react';

interface BookingType {
  _id: string;
  patientName: string;
  totalAmount: number;
  status: string;
  tests: { title: string; category: string }[];
  address?: string;
  assignedPartnerName?: string;
  reportFileUrl?: string;
}

const MOCK_PARTNERS = [
  { id: 'p1', name: 'Ritesh Sharma' },
  { id: 'p2', name: 'Amit Verma' },
  { id: 'p3', name: 'Sunil Patil' }
];

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Intelligence');
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) setBookings(await res.json());
    } catch (error) {
      console.error('Failed to load admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, extraData: object = {}) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extraData })
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(prev => prev.map(b => b._id === id ? updated : b));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => router.push('/');

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const acceptedCount = bookings.filter(b => b.status === 'accepted').length;
  const verificationCount = bookings.filter(b => b.status === 'report_uploaded').length;

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col lg:flex-row font-sans p-4 lg:p-8 gap-8">
      <aside className="w-full lg:w-80 glass-dark rounded-[3.5rem] p-8 flex flex-col relative z-20">
        <div className="flex items-center gap-4 mb-16 border-b border-white/5 pb-10">
          <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-900/50">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter">ADMIN<span className="text-rose-600">OS</span></h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">V3.5 Diagnostic Workflow</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-3">
          {[
            { id: 'Intelligence', icon: LayoutDashboard },
            { id: 'Specimens', icon: FileText, badge: pendingCount + verificationCount },
            { id: 'Partners', icon: HeartHandshake },
            { id: 'Config', icon: SettingsIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-[2rem] text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-900 shadow-2xl shadow-white/5 scale-105' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3">
                <tab.icon className="w-5 h-5" />
                {tab.id}
              </span>
              {tab.badge ? (
                <span className="bg-rose-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center animate-pulse">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="mt-10 flex items-center gap-3 text-slate-500 hover:text-rose-500 font-bold px-6 py-4 rounded-[2rem]">
          <LogOut className="w-5 h-5" /> Terminate Session
        </button>
      </aside>

      <main className="flex-1 space-y-8 overflow-y-auto">
        <header className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] mb-3 block">Real-time Lab Monitor</span>
            <h1 className="text-5xl font-black text-white tracking-tighter">{activeTab} Workstation</h1>
          </div>
          <button onClick={fetchData} className="w-16 h-16 glass-dark rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
            <RefreshCw className={`text-white w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {activeTab === 'Specimens' && (
          <div className="space-y-8">
            {/* Step 1: Acceptance */}
            <div className="glass-dark p-12 rounded-[4rem]">
              <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                <UserCheck className="text-rose-600" /> Pending Lab Acceptance
              </h3>
              <div className="space-y-4">
                {bookings.filter(b => b.status === 'pending').length === 0 ? (
                  <p className="text-slate-500 text-sm italic">No new patient requests.</p>
                ) : (
                  bookings.filter(b => b.status === 'pending').map(b => (
                    <div key={b._id} className="bg-white/5 p-8 rounded-[2.5rem] flex items-center justify-between border border-white/5">
                      <div>
                        <p className="text-white font-black text-lg">{b.patientName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{b.tests[0].title} • {b._id.slice(-6)}</p>
                      </div>
                      <button 
                        onClick={() => handleUpdateStatus(b._id, 'accepted')}
                        disabled={actionLoading === b._id}
                        className="px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20"
                      >
                        {actionLoading === b._id ? <Loader2 className="animate-spin w-4 h-4" /> : 'Accept Request'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Step 2: Assignment */}
            <div className="glass-dark p-12 rounded-[4rem]">
              <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-4">
                <UserPlus2 className="text-blue-500" /> Dispatch & Assignment
              </h3>
              <div className="space-y-4">
                {bookings.filter(b => b.status === 'accepted').length === 0 ? (
                  <p className="text-slate-500 text-sm italic">No specimens awaiting assignment.</p>
                ) : (
                  bookings.filter(b => b.status === 'accepted').map(b => (
                    <div key={b._id} className="bg-white/5 p-8 rounded-[2.5rem] flex items-center justify-between border border-white/5">
                      <div>
                        <p className="text-white font-black text-lg">{b.patientName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Confirmed • Awaiting Dispatcher</p>
                      </div>
                      <div className="flex gap-4">
                        <select 
                          className="bg-slate-900 text-white border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-rose-600"
                          onChange={(e) => {
                            const partner = MOCK_PARTNERS.find(p => p.id === e.target.value);
                            if (partner) handleUpdateStatus(b._id, 'assigned', { assignedPartnerId: partner.id, assignedPartnerName: partner.name });
                          }}
                          disabled={actionLoading === b._id}
                        >
                          <option value="">Select Partner</option>
                          {MOCK_PARTNERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Verification */}
            <div className="glass-dark p-12 rounded-[4rem]">
              <h3 className="text-2xl font-black text-white mb-8">Clinical Verification Queue</h3>
              <div className="space-y-4">
                {bookings.filter(b => b.status === 'report_uploaded').map(b => (
                  <div key={b._id} className="bg-white/5 p-8 rounded-[2.5rem] flex items-center justify-between border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center"><ClipboardCheck className="text-white w-6 h-6"/></div>
                      <div>
                        <p className="text-white font-black text-lg">{b.patientName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Report Uploaded by {b.assignedPartnerName}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <a href={b.reportFileUrl} target="_blank" className="px-6 py-3 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Review</a>
                      <button 
                        onClick={() => handleUpdateStatus(b._id, 'completed')}
                        className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20"
                      >
                        Verify & Release
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Intelligence' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-dark p-10 rounded-[3rem]">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-6">Workflow Intelligence</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-white text-sm">Active Field Agents</span> <span className="text-rose-500 font-bold">3</span></div>
                  <div className="flex justify-between items-center"><span className="text-white text-sm">Processing Specimens</span> <span className="text-amber-500 font-bold">{bookings.filter(b => ['assigned', 'reached', 'sample_collected'].includes(b.status)).length}</span></div>
                  <div className="flex justify-between items-center"><span className="text-white text-sm">Total Throughput</span> <span className="text-emerald-500 font-bold">{bookings.length}</span></div>
                </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}