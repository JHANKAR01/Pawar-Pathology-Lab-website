
import React, { useState, useEffect } from 'react';
// Added missing ShieldCheck and LogOut icons
import { LayoutDashboard, Users, FlaskConical, FileText, Plus, DollarSign, Clock, AlertCircle, Home, HeartHandshake, Settings, CheckCircle, Bell, ArrowUpRight, Search, ShieldCheck, LogOut } from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { mockApi } from '../../lib/mockApi';

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('Intelligence');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [config, setConfig] = useState({ requireVerification: true });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setBookings(mockApi.getBookings());
    setConfig(mockApi.getSettings());
  };

  const awaitingVerification = bookings.filter(b => b.status === BookingStatus.REPORT_UPLOADED);

  const stats = [
    { label: "Revenue Matrix", value: `₹${bookings.reduce((a, b) => a + (b.totalAmount || 0), 0)}`, trend: "+12.5%", color: "rose" },
    { label: "Specimens Active", value: bookings.filter(b => b.status === BookingStatus.PENDING).length.toString(), trend: "-2", color: "blue" },
    { label: "Reports Pending", value: awaitingVerification.length.toString(), trend: "Critical", color: "amber" },
    { label: "Total Registrations", value: bookings.length.toString(), trend: "Total", color: "emerald" },
  ];

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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">V2.4 Active</p>
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
                {tab === 'Config' && <Settings className="w-5 h-5" />}
                {tab}
              </span>
              {tab === 'Specimens' && awaitingVerification.length > 0 && (
                <span className="bg-rose-600 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center">{awaitingVerification.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-10 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-3 text-slate-500 hover:text-rose-500 font-bold px-6 py-4 rounded-[2rem] transition-all">
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
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
                    <span>Performance Matrix</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
               <div className="xl:col-span-2 glass-dark p-12 rounded-[4rem]">
                  <div className="flex justify-between items-center mb-12">
                    <h3 className="text-2xl font-black text-white tracking-tight">Specimen Flow <span className="text-slate-500 text-sm ml-4 font-bold">LATEST UPDATES</span></h3>
                    <button className="text-rose-500 text-[10px] font-black uppercase tracking-widest hover:text-white">View Archive</button>
                  </div>
                  <div className="space-y-4">
                    {bookings.slice(-4).reverse().map(b => (
                      <div key={b.id} className="group flex items-center justify-between p-8 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-rose-600/30 transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl">
                            {b.patientName[0]}
                          </div>
                          <div>
                            <p className="font-black text-white text-lg tracking-tight">{b.patientName}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{b.tests[0].category} • {b.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-10">
                           <div className="text-right hidden md:block">
                              <p className="text-white font-black">₹{b.totalAmount}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Transaction Verified</p>
                           </div>
                           <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              b.status === BookingStatus.COMPLETED ? 'bg-emerald-600/20 text-emerald-400' : 'bg-rose-600/20 text-rose-400'
                            }`}>{b.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               <div className="glass-dark p-12 rounded-[4rem]">
                  <h3 className="text-2xl font-black text-white tracking-tight mb-12">System Hub</h3>
                  <div className="space-y-8">
                     <div className="p-8 rounded-[2.5rem] bg-rose-600 text-white shadow-2xl shadow-rose-900/40">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">NABL Compliance</p>
                        <p className="text-lg font-black leading-tight mb-6">Annual Certification Review Pending in 45 Days</p>
                        <button className="w-full py-4 bg-white text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50">Upload Documentation</button>
                     </div>
                     <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                           <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Cloud Health</p>
                           <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black uppercase">
                              <span className="text-slate-500">Node Sync</span>
                              <span className="text-white">Active</span>
                           </div>
                           <div className="flex justify-between text-[10px] font-black uppercase">
                              <span className="text-slate-500">Security Layers</span>
                              <span className="text-white">Encrypted</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
