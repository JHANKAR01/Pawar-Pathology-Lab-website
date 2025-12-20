
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, FileText, HeartHandshake, Settings as SettingsIcon, 
  Bell, ArrowUpRight, Search, ShieldCheck, LogOut 
} from 'lucide-react';
import { BookingStatus, IBooking } from '@/models/Booking'; // Import types directly if available or redefine

// Types suitable for frontend
interface BookingType {
  _id: string;
  patientName: string;
  totalAmount: number;
  status: string;
  tests: { category: string }[];
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Intelligence');
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/bookings');
        if (res.ok) {
          const data = await res.json();
          setBookings(data);
        }
      } catch (error) {
        console.error('Failed to load admin data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    // In a real app, clear cookies/tokens
    router.push('/');
  };

  const awaitingVerification = bookings.filter(b => b.status === 'report_uploaded');

  const stats = [
    { label: "Revenue Matrix", value: `₹${bookings.reduce((a, b) => a + (b.totalAmount || 0), 0)}`, trend: "+12.5%", color: "rose" },
    { label: "Specimens Active", value: bookings.filter(b => b.status === 'pending').length.toString(), trend: "-2", color: "blue" },
    { label: "Reports Pending", value: awaitingVerification.length.toString(), trend: "Critical", color: "amber" },
    { label: "Total Registrations", value: bookings.length.toString(), trend: "Total", color: "emerald" },
  ];

  if (loading) {
      return (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-rose-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans p-4 lg:p-8 gap-8">
      {/* OS Sidebar */}
      <aside className="w-full lg:w-80 glass-dark rounded-[3.5rem] p-8 flex flex-col relative z-20">
        <div className="flex items-center gap-4 mb-16 border-b border-white/5 pb-10">
          <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-900/50">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter">ADMIN<span className="text-rose-600">OS</span></h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">V3.0 Connected</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-3">
          {['Intelligence', 'Specimens', 'Partners', 'Config'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center justify-between px-6 py-4 rounded-[2rem] text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-white text-slate-900 shadow-2xl shadow-white/5' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-3">
                {tab === 'Intelligence' && <LayoutDashboard className="w-5 h-5" />}
                {tab === 'Specimens' && <FileText className="w-5 h-5" />}
                {tab === 'Partners' && <HeartHandshake className="w-5 h-5" />}
                {tab === 'Config' && <SettingsIcon className="w-5 h-5" />}
                {tab}
              </span>
              {tab === 'Specimens' && awaitingVerification.length > 0 && (
                <span className="bg-rose-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center">{awaitingVerification.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-10 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 text-slate-500 hover:text-rose-500 font-bold px-6 py-4 rounded-[2rem] transition-all">
            <LogOut className="w-5 h-5" /> Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 space-y-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="view-transition">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] mb-3 block">Real-time Clinical Monitor</span>
            <h1 className="text-5xl font-black text-white tracking-tighter">{activeTab} Workstation</h1>
          </div>
          <div className="flex gap-4">
             <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input placeholder="Search global logs..." className="bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-5 text-white text-xs font-bold outline-none focus:ring-2 focus:ring-rose-600 transition-all w-64" />
             </div>
             <button className="w-16 h-16 glass-dark rounded-full flex items-center justify-center relative hover:bg-white/10 transition-all">
                <Bell className="text-white w-6 h-6" />
                <span className="absolute top-4 right-4 w-3 h-3 bg-rose-600 rounded-full border-2 border-slate-950" />
             </button>
          </div>
        </header>

        {activeTab === 'Intelligence' && (
          <div className="space-y-10 view-transition">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map(s => (
                <div key={s.label} className="glass-dark p-10 rounded-[3rem] group hover:bg-white/5 transition-all">
                  <div className="flex justify-between items-start mb-10">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">{s.label}</p>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-lg ${s.color === 'rose' ? 'bg-rose-600/20 text-rose-500' : 'bg-white/10 text-slate-300'}`}>
                      {s.trend}
                    </span>
                  </div>
                  <p className="text-5xl font-black text-white tracking-tighter">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="glass-dark p-12 rounded-[4rem]">
                <h3 className="text-2xl font-black text-white tracking-tight mb-8">Recent Specimens</h3>
                <div className="space-y-4">
                {bookings.slice(0, 5).map(b => (
                    <div key={b._id} className="group flex items-center justify-between p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-rose-600/30 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl">
                        {b.patientName?.[0] || 'U'}
                        </div>
                        <div>
                        <p className="font-black text-white text-lg tracking-tight">{b.patientName}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{b.tests?.[0]?.category || 'General'} • {b._id.slice(-6)}</p>
                        </div>
                    </div>
                    <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        b.status === 'completed' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-rose-600/20 text-rose-400'
                    }`}>{b.status.replace('_', ' ')}</span>
                    </div>
                ))}
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
