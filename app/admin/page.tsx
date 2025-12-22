'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, HeartHandshake, Settings as SettingsIcon, 
  ShieldCheck, LogOut, RefreshCw, Trash2, UserCheck, Settings2
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

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Intelligence');
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartner, setNewPartner] = useState({ name: '', email: '', username: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ requireVerification: true });

  // Server-side admin guard
  useEffect(() => {
    const checkAdminStatus = async () => {
      const token = localStorage.getItem('pawar_lab_auth_token');

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/check-admin', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // If response is not ok, assume not admin or token is invalid
          router.push('/login');
          return;
        }

        const data = await response.json();
        console.log('Admin check response:', data); // Debug log for admin status
        if (!data.isAdmin) {
          router.push('/login');
        } else {
          // If admin, proceed to fetch data
          fetchData();
          fetchPartners();
          fetchConfig();
        }
      } catch (error) {
        console.error('Failed to verify admin status:', error);
        router.push('/login'); // Redirect on any error during verification
      }
    };

    checkAdminStatus();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('pawar_lab_auth_token'); // Get token for API calls
    try {
      const res = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) setBookings(await res.json());
      else if (res.status === 401 || res.status === 403) router.push('/login'); // Redirect if unauthorized
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) setConfig(await res.json());
      else if (res.status === 401 || res.status === 403) router.push('/login');
    } catch (err) { console.error(err); }
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
      setBookings(prev => prev.map(booking => booking._id === id ? updatedBooking : booking));
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
                  ? 'bg-white text-slate-900 shadow-2xl' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.id}
            </button>
          ))}
        </nav>
        <button onClick={() => { localStorage.removeItem('pawar_lab_auth_token'); router.push('/login'); }} className="mt-10 flex items-center gap-3 text-slate-500 hover:text-rose-500 font-bold px-6 py-4 rounded-[2rem]">
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

        {activeTab === 'Bookings' && (
          <div className="space-y-6 animate-in fade-in">
             {bookings.filter(b => b.status !== 'completed').map(b => (
                <div key={b._id} className="glass-dark p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                     <div>
                        <h3 className="text-xl font-black text-white">{b.patientName}</h3>
                        <p className="text-slate-500 text-xs font-bold uppercase mt-1">
                            {b.address ? `Home Visit: ${b.address}` : 'Lab Visit'}
                        </p>
                     </div>
                     <div className="text-right">
                        <p className="text-white text-lg font-black">₹{b.totalAmount}</p>
                        <p className="text-slate-500 text-xs uppercase font-bold">
                            Paid: <span className="text-emerald-500">₹{b.amountTaken}</span> / 
                            Balance: <span className="text-rose-500">₹{b.balanceAmount}</span>
                        </p>
                     </div>
                   </div>
                   <div className="flex flex-wrap gap-2 mb-4">
                     {b.tests?.map((t: any) => (
                       <span key={t.id} className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white">{t.title}</span>
                     ))}
                   </div>
                   <div className="flex gap-4 items-center mt-4">
                      {b.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(b._id, 'accepted')}
                            className="px-8 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(b._id, 'declined')}
                            className="px-8 py-3 bg-red-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {b.status === 'accepted' && (
                         <div className="flex gap-2">
                           {partners.map(p => (
                             <button 
                               key={p._id}
                               onClick={() => handleUpdateStatus(b._id, 'assigned', { assignedPartnerId: p._id, assignedPartnerName: p.name })}
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
                      {b.contactNumber && (
                        <a href={`tel:${b.contactNumber}`} className="px-4 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700">Call</a>
                      )}
                      {b.email && (
                        <a href={`mailto:${b.email}`} className="px-4 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700">Email</a>
                      )}
                   </div>
                   {b.assignedPartnerName && (
                       <p className="text-slate-400 text-xs font-bold uppercase mt-2">Assigned to: {b.assignedPartnerName}</p>
                   )}
                </div>
             ))}
          </div>
        )}

        {activeTab === 'Specimens' && (
          <div className="glass-dark p-8 rounded-[3rem]">
            <table className="w-full text-white">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="p-4">Patient</th>
                  <th className="p-4">Tests</th>
                  <th className="p-4">Referred By</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id} className="border-b border-white/5">
                    <td className="p-4 font-bold">{b.patientName}</td>
                    <td className="p-4 text-slate-400">{b.tests.map(t => t.title).join(', ')}</td>
                    <td className="p-4 text-slate-400">{b.referredBy}</td>
                    <td className="p-4 font-bold">₹{b.totalAmount}</td>
                    <td className="p-4 font-bold text-rose-500">₹{b.balanceAmount}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500">{b.status}</span>
                    </td>
                    <td className="p-4 text-slate-400">{b.assignedPartnerName || 'N/A'}</td>
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
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Full Name</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-rose-600"
                        value={newPartner.name}
                        onChange={e => setNewPartner({...newPartner, name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Email</label>
                      <input 
                        type="email"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-rose-600"
                        value={newPartner.email}
                        onChange={e => setNewPartner({...newPartner, email: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Username</label>
                      <input 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-rose-600"
                        value={newPartner.username}
                        onChange={e => setNewPartner({...newPartner, username: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Password</label>
                      <input 
                        type="password"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-rose-600"
                        value={newPartner.password}
                        onChange={e => setNewPartner({...newPartner, password: e.target.value})}
                      />
                   </div>
                   <button className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700">Onboard Partner</button>
                </form>
             </div>
             <div className="glass-dark p-12 rounded-[4rem]">
                <h3 className="text-2xl font-black text-white mb-8">Active Directory</h3>
                <div className="space-y-4">
                   {partners.map(p => (
                     <div key={p._id} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-rose-600"><UserCheck /></div>
                           <div>
                              <p className="text-white font-black">{p.name}</p>
                              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{p.operationalRole}</p>
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