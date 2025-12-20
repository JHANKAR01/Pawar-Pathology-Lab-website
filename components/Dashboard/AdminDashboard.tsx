import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, FileText, HeartHandshake, Settings as SettingsIcon, 
  Search, ShieldCheck, LogOut, RefreshCw, Trash2, UserCheck, Check, FlaskConical, AlertCircle, Settings2, Bell, ArrowUpRight 
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { mockApi } from '../../lib/mockApi';

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('Intelligence');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [partners, setPartners] = useState([
    { id: 'p1', name: 'Ritesh Sharma', role: 'Field Phlebotomist' },
    { id: 'p2', name: 'Amit Verma', role: 'Lab Technician' }
  ]);
  const [config, setConfig] = useState({ requireVerification: true });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLoading(true);
    setBookings(mockApi.getBookings());
    setConfig(mockApi.getSettings());
    setTimeout(() => setLoading(false), 300);
  };

  const handleUpdateStatus = (id: string, status: BookingStatus, extra = {}) => {
    mockApi.updateBookingStatus(id, status, extra);
    refreshData();
  };

  const handleToggleConfig = () => {
    const newConfig = { ...config, requireVerification: !config.requireVerification };
    mockApi.updateSettings(newConfig);
    setConfig(newConfig);
  };

  const stats = [
    { label: "Revenue Matrix", value: `₹${bookings.reduce((a, b) => a + (b.totalAmount || 0), 0)}`, trend: "+12.5%", color: "rose" },
    { label: "Pending Approval", value: bookings.filter(b => b.status === BookingStatus.PENDING).length.toString(), trend: "Action Req", color: "amber" },
    { label: "Active Partners", value: partners.length.toString(), trend: "Online", color: "emerald" },
    { label: "Total Load", value: bookings.length.toString(), trend: "Total", color: "blue" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row font-sans p-4 lg:p-8 gap-8">
      <aside className="w-full lg:w-80 glass-dark rounded-[3.5rem] p-8 flex flex-col relative z-20">
        <div className="flex items-center gap-4 mb-16 border-b border-white/5 pb-10">
          <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-900/50">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tighter">ADMIN<span className="text-rose-600">OS</span></h2>
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
        <button onClick={onLogout} className="mt-10 flex items-center gap-3 text-slate-500 hover:text-rose-500 font-bold px-6 py-4 rounded-[2rem]">
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </aside>

      <main className="flex-1 space-y-8 overflow-y-auto">
        <header className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] mb-3 block">Node System Monitor</span>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">{activeTab}</h1>
          </div>
          <button onClick={refreshData} className="w-16 h-16 glass-dark rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
            <RefreshCw className={`text-white w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {activeTab === 'Intelligence' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map(s => (
              <div key={s.label} className="glass-dark p-10 rounded-[3rem]">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">{s.label}</p>
                <p className="text-4xl font-black text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Specimens' && (
          <div className="space-y-6">
            {bookings.filter(b => b.status !== BookingStatus.COMPLETED).reverse().map(b => (
              <div key={b.id} className="glass-dark p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                  <h3 className="text-xl font-black text-white">{b.patientName}</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                    {b.tests.map(t => t.title).join(', ')} • {b.status}
                  </p>
                </div>
                <div className="flex gap-3">
                  {b.status === BookingStatus.PENDING && (
                    <button onClick={() => handleUpdateStatus(b.id, BookingStatus.ACCEPTED)} className="px-6 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase">Approve</button>
                  )}
                  {b.status === BookingStatus.ACCEPTED && (
                    <div className="flex gap-2">
                      {partners.map(p => (
                        <button key={p.id} onClick={() => handleUpdateStatus(b.id, BookingStatus.ASSIGNED, { assignedPartnerId: p.id, assignedPartnerName: p.name })} className="px-4 py-2 bg-white/10 text-white rounded-lg text-[9px] font-black uppercase hover:bg-rose-600">Assign {p.name}</button>
                      ))}
                    </div>
                  )}
                  {b.status === BookingStatus.REPORT_UPLOADED && (
                    <button onClick={() => handleUpdateStatus(b.id, BookingStatus.COMPLETED)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase">Verify & Release</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'Partners' && (
           <div className="glass-dark p-12 rounded-[4rem]">
              <h3 className="text-2xl font-black text-white mb-8">Clinical Partner Directory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {partners.map(p => (
                    <div key={p.id} className="p-8 bg-white/5 border border-white/5 rounded-3xl flex justify-between items-center">
                       <div>
                          <p className="text-white font-black text-lg">{p.name}</p>
                          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{p.role}</p>
                       </div>
                       <UserCheck className="text-rose-600" />
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'Config' && (
           <div className="glass-dark p-12 rounded-[4rem] max-w-xl">
              <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-4"><Settings2 className="text-rose-600" /> Gatekeeper Settings</h3>
              <div className="flex items-center justify-between p-8 bg-white/5 rounded-[2rem] border border-white/10">
                 <div>
                    <p className="text-white font-black">Strict Verification</p>
                    <p className="text-xs text-slate-500">Require MD Pathologist review for all reports.</p>
                 </div>
                 <button onClick={handleToggleConfig} className={`w-14 h-7 rounded-full transition-all relative ${config.requireVerification ? 'bg-rose-600' : 'bg-slate-700'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${config.requireVerification ? 'left-8' : 'left-1'}`} />
                 </button>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;