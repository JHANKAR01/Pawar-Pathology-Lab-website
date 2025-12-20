
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, FileText, HeartHandshake, Settings as SettingsIcon, 
  Search, ShieldCheck, LogOut, RefreshCw, Trash2, UserCheck, Check, FlaskConical, AlertCircle, Settings2
} from 'lucide-react';

interface BookingType {
  _id: string;
  patientName: string;
  totalAmount: number;
  status: string;
  tests: { title: string; category: string }[];
  assignedPartnerName?: string;
}

interface Partner {
  id: string;
  name: string;
  role: string;
  activeTasks: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Intelligence');
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [partners, setPartners] = useState<Partner[]>([
    { id: 'p1', name: 'Ritesh Sharma', role: 'Field Phlebotomist', activeTasks: 0 },
    { id: 'p2', name: 'Amit Verma', role: 'Lab Technician', activeTasks: 0 }
  ]);
  const [newPartner, setNewPartner] = useState({ name: '', role: 'Field Phlebotomist' });
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ requireVerification: true });

  useEffect(() => {
    fetchData();
    fetchConfig();
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

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) setConfig(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, extraData: object = {}) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extraData })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleConfig = async () => {
    const newConfig = { ...config, requireVerification: !config.requireVerification };
    setConfig(newConfig);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
  };

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    const p = { id: 'p' + (partners.length + 1), ...newPartner, activeTasks: 0 };
    setPartners([...partners, p]);
    setNewPartner({ name: '', role: 'Field Phlebotomist' });
    alert('Partner Added Successfully');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col lg:flex-row font-sans p-4 lg:p-8 gap-8">
      <aside className="w-full lg:w-80 glass-dark rounded-[3.5rem] p-8 flex flex-col relative z-20">
        <div className="flex items-center gap-4 mb-16 border-b border-white/5 pb-10">
          <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter uppercase">ADMIN<span className="text-rose-600">OS</span></h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em]">V3.5 Clinical</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-3">
          {[
            { id: 'Intelligence', icon: LayoutDashboard },
            { id: 'Specimens', icon: FlaskConical },
            { id: 'Partners', icon: HeartHandshake },
            { id: 'Config', icon: SettingsIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-[2rem] text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-900 shadow-2xl' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.id}
            </button>
          ))}
        </nav>
        <button onClick={() => router.push('/')} className="mt-10 flex items-center gap-3 text-slate-500 hover:text-rose-500 font-bold px-6 py-4 rounded-[2rem]">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </aside>

      <main className="flex-1 space-y-8 overflow-y-auto">
        <header className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] mb-3 block">Node System Monitor</span>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">{activeTab}</h1>
          </div>
          <button onClick={fetchData} className="w-16 h-16 glass-dark rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
            <RefreshCw className={`text-white w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {activeTab === 'Intelligence' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
             <div className="glass-dark p-10 rounded-[3rem]">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Total Revenue</p>
                <p className="text-5xl font-black text-white">₹{bookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0)}</p>
             </div>
             <div className="glass-dark p-10 rounded-[3rem]">
                <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-4">Pending Approval</p>
                <p className="text-5xl font-black text-white">{bookings.filter(b => b.status === 'pending').length}</p>
             </div>
             <div className="glass-dark p-10 rounded-[3rem]">
                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-4">Completed Cycles</p>
                <p className="text-5xl font-black text-white">{bookings.filter(b => b.status === 'completed').length}</p>
             </div>
          </div>
        )}

        {activeTab === 'Specimens' && (
          <div className="space-y-6 animate-in fade-in">
             {bookings.filter(b => b.status !== 'completed').map(b => (
                <div key={b._id} className="glass-dark p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between gap-8 items-center">
                   <div>
                      <h3 className="text-xl font-black text-white">{b.patientName}</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase mt-1">{b.tests[0].title} • {b.status.replace('_', ' ')}</p>
                   </div>
                   <div className="flex gap-4">
                      {b.status === 'pending' && (
                        <button 
                          onClick={() => handleUpdateStatus(b._id, 'accepted')}
                          className="px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Approve
                        </button>
                      )}
                      {b.status === 'accepted' && (
                         <div className="flex gap-2">
                           {partners.map(p => (
                             <button 
                               key={p.id}
                               onClick={() => handleUpdateStatus(b._id, 'assigned', { assignedPartnerId: p.id, assignedPartnerName: p.name })}
                               className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase hover:bg-rose-600 transition-all"
                             >
                               Assign {p.name}
                             </button>
                           ))}
                         </div>
                      )}
                      {b.status === 'report_uploaded' && (
                        <button 
                          onClick={() => handleUpdateStatus(b._id, 'completed')}
                          className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Verify & Release
                        </button>
                      )}
                   </div>
                </div>
             ))}
          </div>
        )}

        {activeTab === 'Partners' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
             <div className="glass-dark p-12 rounded-[4rem]">
                <h3 className="text-2xl font-black text-white mb-8">Register New Partner</h3>
                <form onSubmit={handleAddPartner} className="space-y-6">
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Full Name</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-rose-600"
                        value={newPartner.name}
                        onChange={e => setNewPartner({...newPartner, name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Operational Role</label>
                      <select 
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none"
                        value={newPartner.role}
                        onChange={e => setNewPartner({...newPartner, role: e.target.value})}
                      >
                         <option>Field Phlebotomist</option>
                         <option>Lab Technician</option>
                         <option>Pathologist</option>
                      </select>
                   </div>
                   <button className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest">Onboard Partner</button>
                </form>
             </div>
             <div className="glass-dark p-12 rounded-[4rem]">
                <h3 className="text-2xl font-black text-white mb-8">Active Directory</h3>
                <div className="space-y-4">
                   {partners.map(p => (
                     <div key={p.id} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-rose-600"><UserCheck /></div>
                           <div>
                              <p className="text-white font-black">{p.name}</p>
                              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{p.role}</p>
                           </div>
                        </div>
                        <Trash2 className="text-slate-700 cursor-pointer hover:text-rose-600" />
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'Config' && (
          <div className="animate-in fade-in">
             <div className="glass-dark p-12 rounded-[4rem] max-w-2xl">
                <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-4">
                   <Settings2 className="text-rose-600" /> Clinical Gateways
                </h3>
                <div className="space-y-8">
                   <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                      <div>
                         <p className="text-white font-black text-lg">Pathologist Verification</p>
                         <p className="text-xs text-slate-500 font-medium mt-1">Require manual review before patient visibility.</p>
                      </div>
                      <button 
                        onClick={handleToggleConfig}
                        className={`w-16 h-8 rounded-full transition-all relative ${config.requireVerification ? 'bg-rose-600' : 'bg-slate-700'}`}
                      >
                         <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${config.requireVerification ? 'left-9' : 'left-1'}`} />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
