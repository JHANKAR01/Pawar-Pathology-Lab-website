'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, HeartHandshake, Settings as SettingsIcon, 
  ShieldCheck, LogOut, RefreshCw, Trash2, UserCheck, Settings2, Home, Loader2, Calendar
} from 'lucide-react';
import { FlaskConical } from 'lucide-react';

interface BookingType {
  _id: string;
  patientName: string;
  totalAmount: number;
  balanceAmount: number;
  referredBy: string;
  status: string;
  tests: { title: string; category: string }[];
  assignedPartnerName?: string;
}

interface Partner {
  _id: string;
  name: string;
  operationalRole: string;
}

interface BlackoutDateType {
  _id: string;
  reason: string;
  startDate: string;
  endDate: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Intelligence');
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartner, setNewPartner] = useState({ name: '', email: '', username: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ requireVerification: true });
  const [isVerified, setIsVerified] = useState(false);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDateType[]>([]);
  const [newBlackout, setNewBlackout] = useState({ reason: '', startDate: '', endDate: '' });

  useEffect(() => {
    const checkAdminStatus = async () => {
      const token = localStorage.getItem('pawar_lab_auth_token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const res = await fetch('/api/auth/check-admin', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Not admin');

        const data = await res.json();
        if (data.isAdmin) {
          setIsVerified(true);
          fetchData();
          fetchPartners();
          fetchConfig();
          fetchBlackoutDates();
        } else {
          throw new Error('Not admin');
        }
      } catch (err) {
        router.push('/login');
      }
    };
    checkAdminStatus();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setBookings(await res.json());
      else if (res.status === 401 || res.status === 403) router.push('/login');
    } catch (error) {
      console.error('Failed to load admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch('/api/users?role=partner', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setPartners(await res.json());
      else if (res.status === 401 || res.status === 403) router.push('/login');
    } catch (error) {
      console.error('Failed to load partners', error);
    }
  };

  const fetchConfig = async () => {
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setConfig(await res.json());
      else if (res.status === 401 || res.status === 403) router.push('/login');
    } catch (err) { console.error(err); }
  };
  
  const fetchBlackoutDates = async () => {
    try {
      const res = await fetch('/api/settings/blackout-dates');
      if (res.ok) {
        setBlackoutDates(await res.json());
      }
    } catch (error) {
      console.error('Failed to load blackout dates', error);
    }
  };

  const handleAddBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch('/api/settings/blackout-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newBlackout),
      });
      if (res.ok) {
        setNewBlackout({ reason: '', startDate: '', endDate: '' });
        fetchBlackoutDates();
      } else {
        alert('Failed to add blackout date.');
      }
    } catch (err) {
      alert('An error occurred while adding blackout date.');
    }
  };

  const handleDeleteBlackout = async (id: string) => {
    if (!confirm('Are you sure you want to remove this blackout period?')) return;
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch(`/api/settings/blackout-dates?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchBlackoutDates();
      } else {
        alert('Failed to delete blackout date.');
      }
    } catch (err) {
      alert('An error occurred while deleting blackout date.');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, extraData: object = {}) => {
    const originalBookings = bookings;
    setBookings(prev => prev.map(booking => 
      booking._id === id ? { ...booking, status: newStatus, ...extraData } : booking
    ));

    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, ...extraData })
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) router.push('/login');
        throw new Error('Failed to update status');
      }
      const updatedBooking = await res.json();
      // Refetch all data to ensure consistency
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update status. Reverting changes.');
      setBookings(originalBookings);
    }
  };

  const handleToggleConfig = async () => {
    const newConfig = { ...config, requireVerification: !config.requireVerification };
    setConfig(newConfig);
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newConfig)
      });
      if (res.status === 401 || res.status === 403) router.push('/login');
    } catch (e) { console.error("Config save failed", e); }
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newPartner, role: 'partner', operationalRole: 'helper' })
      });
      if (res.ok) {
        setNewPartner({ name: '', email: '', username: '', password: '' });
        fetchPartners();
        alert('Partner Added Successfully');
      } else {
        if (res.status === 401 || res.status === 403) router.push('/login');
        const errorData = await res.json();
        alert(`Failed to add partner: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    }
  };

  const getStatusBadge = (status: string) => {
    const base = 'px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest';
    switch (status) {
      case 'pending': return `${base} bg-amber-500/10 text-amber-500`;
      case 'accepted': return `${base} bg-emerald-500/10 text-emerald-500`;
      case 'assigned': return `${base} bg-sky-500/10 text-sky-500`;
      case 'completed': return `${base} bg-slate-500/10 text-slate-500`;
      default: return `${base} bg-slate-700 text-slate-300`;
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans p-4 lg:p-8 gap-8">
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
            { id: 'Bookings', icon: FlaskConical },
            { id: 'Specimens', icon: FlaskConical },
            { id: 'Partners', icon: HeartHandshake },
            { id: 'Config', icon: SettingsIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-[2rem] text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-rose-600 text-white shadow-2xl' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.id}
            </button>
          ))}
        </nav>
        <div className="mt-10 pt-10 border-t border-white/5">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-6 py-4 rounded-[2rem] text-sm font-bold transition-all text-slate-500 hover:text-white hover:bg-white/5">
            <Home className="w-5 h-5" /> Homepage
          </button>
          <button onClick={() => { localStorage.removeItem('pawar_lab_auth_token'); localStorage.removeItem('pawar_lab_user'); localStorage.removeItem('pawar_lab_user_role'); router.push('/login'); }} className="w-full mt-2 flex items-center gap-3 px-6 py-4 rounded-[2rem] text-sm font-bold transition-all text-slate-500 hover:text-rose-500">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
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
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Total Revenue</p>
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

        {activeTab === 'Bookings' && (
          <div className="space-y-6 animate-in fade-in">
             {bookings.filter(b => b.status !== 'completed').map(b => (
                <div key={b._id} className="glass-dark p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                   <div className="flex justify-between items-center">
                      <h3 className="text-white font-black text-xl">{b.patientName}</h3>
                      <span className={getStatusBadge(b.status)}>{b.status}</span>
                   </div>
                   <p className="text-slate-400 text-sm font-bold">{b.tests.map(t => t.title).join(' + ')}</p>
                   <div className="flex gap-8 text-white border-t border-white/10 pt-4 mt-2">
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Total</p>
                            <p className="font-bold text-lg">₹{b.totalAmount}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Balance</p>
                            <p className="font-bold text-lg text-rose-500">₹{b.balanceAmount}</p>
                        </div>
                   </div>
                   {b.status === 'pending' && (
                     <button onClick={() => handleUpdateStatus(b._id, 'accepted')} className="mt-4 self-start bg-emerald-500/10 text-emerald-500 px-6 py-3 rounded-xl font-bold text-xs hover:bg-emerald-500/20 transition-all">
                       Approve Booking
                     </button>
                   )}
                </div>
             ))}
          </div>
        )}

        {activeTab === 'Specimens' && (
          <div className="glass-dark p-8 rounded-[3rem]">
            <table className="w-full text-left text-white">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Patient</th>
                        <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Tests</th>
                        <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Status</th>
                        <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-500">Assign Partner</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.filter(b => b.status === 'accepted' || b.status === 'assigned').map(b => (
                        <tr key={b._id} className="border-b border-white/5">
                            <td className="p-4 font-bold">{b.patientName}</td>
                            <td className="p-4 text-slate-400 text-sm">{b.tests.map(t => t.title).join(', ')}</td>
                            <td className="p-4">
                                <span className={getStatusBadge(b.status)}>{b.status}</span>
                                {b.assignedPartnerName && <p className="text-xs text-sky-400 mt-1">{b.assignedPartnerName}</p>}
                            </td>
                            <td className="p-4">
                                <select 
                                    onChange={(e) => handleUpdateStatus(b._id, 'assigned', { assignedPartnerName: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white font-bold w-full"
                                    defaultValue={b.assignedPartnerName || ""}
                                >
                                    <option value="" disabled>Select a partner</option>
                                    {partners.map(p => (
                                        <option key={p._id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Partners' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
             <div className="glass-dark p-12 rounded-[4rem]">
                <h3 className="text-2xl font-black text-white mb-8">Register New Partner</h3>
                <form onSubmit={handleAddPartner} className="space-y-6">
                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" placeholder="Full Name" value={newPartner.name} onChange={e => setNewPartner({...newPartner, name: e.target.value})} />
                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" placeholder="Email" type="email" value={newPartner.email} onChange={e => setNewPartner({...newPartner, email: e.target.value})} />
                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" placeholder="Username" value={newPartner.username} onChange={e => setNewPartner({...newPartner, username: e.target.value})} />
                    <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold" placeholder="Password" type="password" value={newPartner.password} onChange={e => setNewPartner({...newPartner, password: e.target.value})} />
                    <button type="submit" className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest">Register</button>
                </form>
             </div>
             <div className="glass-dark p-12 rounded-[4rem]">
                 <h3 className="text-2xl font-black text-white mb-8">Active Partners</h3>
                 <div className="space-y-4">
                    {partners.map(p => (
                        <div key={p._id} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl">
                            <p className="font-bold text-white text-lg">{p.name}</p>
                            <p className="text-sm text-slate-400 font-bold uppercase">{p.operationalRole}</p>
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
             
             <div className="glass-dark p-12 rounded-[4rem] max-w-2xl mt-8">
                <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-4">
                    <Calendar className="text-rose-600" /> Clinical Calendar Management
                </h3>
                <form onSubmit={handleAddBlackout} className="space-y-4 mb-8">
                    <input 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold"
                        placeholder="Reason (e.g., Diwali, Maintenance)"
                        value={newBlackout.reason}
                        onChange={e => setNewBlackout({...newBlackout, reason: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input 
                            type="date"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold"
                            value={newBlackout.startDate}
                            onChange={e => setNewBlackout({...newBlackout, startDate: e.target.value})}
                        />
                        <input 
                            type="date"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold"
                            value={newBlackout.endDate}
                            onChange={e => setNewBlackout({...newBlackout, endDate: e.target.value})}
                        />
                    </div>
                    <button type="submit" className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest">Add Block</button>
                </form>
                <div className="space-y-4">
                    {blackoutDates.map(date => (
                        <div key={date._id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                            <div>
                                <p className="font-bold text-white">{date.reason}</p>
                                <p className="text-xs text-slate-400">{date.startDate} to {date.endDate}</p>
                            </div>
                            <button onClick={() => handleDeleteBlackout(date._id)}>
                                <Trash2 className="text-slate-500 hover:text-rose-500" />
                            </button>
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