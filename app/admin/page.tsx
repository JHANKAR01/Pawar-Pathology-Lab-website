'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, HeartHandshake, Settings as SettingsIcon, 
  ShieldCheck, LogOut, RefreshCw, Trash2, UserCheck, Settings2, Home, Loader2, Calendar, FileText, X, CheckCircle, XCircle, Ticket
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
  reportFileUrl?: string;
  reportStatus?: string;
  pathologistNotes?: string;
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
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<BookingType | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isProcessingReview, setIsProcessingReview] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountType: 'percentage' as 'percentage' | 'fixed', value: 0, expiryDate: '', usageLimit: '' });

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
          fetchCoupons();
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

  const handleOpenReview = (booking: BookingType) => {
    setSelectedBookingForReview(booking);
    setRejectNotes('');
    setReviewModalOpen(true);
  };

  const handleReleaseReport = async () => {
    if (!selectedBookingForReview) return;
    setIsProcessingReview(true);
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch(`/api/bookings/${selectedBookingForReview._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'completed',
          reportStatus: 'released'
        })
      });
      if (!res.ok) throw new Error('Failed to release report');
      setReviewModalOpen(false);
      setSelectedBookingForReview(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to release report');
    } finally {
      setIsProcessingReview(false);
    }
  };

  const handleRejectReport = async () => {
    if (!selectedBookingForReview || !rejectNotes.trim()) {
      alert('Please provide rejection notes');
      return;
    }
    setIsProcessingReview(true);
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch(`/api/bookings/${selectedBookingForReview._id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'sample_collected',
          reportStatus: 'rejected',
          pathologistNotes: rejectNotes
        })
      });
      if (!res.ok) throw new Error('Failed to reject report');
      setReviewModalOpen(false);
      setSelectedBookingForReview(null);
      setRejectNotes('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to reject report');
    } finally {
      setIsProcessingReview(false);
    }
  };

  const fetchCoupons = async () => {
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch('/api/coupons', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Failed to fetch coupons', error);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newCoupon.code.toUpperCase().trim(),
          discountType: newCoupon.discountType,
          value: newCoupon.value,
          expiryDate: newCoupon.expiryDate,
          usageLimit: newCoupon.usageLimit ? parseInt(newCoupon.usageLimit) : undefined
        })
      });
      if (res.ok) {
        setNewCoupon({ code: '', discountType: 'percentage', value: 0, expiryDate: '', usageLimit: '' });
        fetchCoupons();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create coupon');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    const token = localStorage.getItem('pawar_lab_auth_token');
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchCoupons();
      } else {
        alert('Failed to delete coupon');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete coupon');
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
    const base = 'px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest';
    switch (status) {
      case 'pending': return `${base} bg-warning/10 text-warning border-2 border-warning/20`;
      case 'accepted': return `${base} bg-success/10 text-success border-2 border-success/20`;
      case 'assigned': return `${base} bg-blue-500/10 text-blue-600 border-2 border-blue-500/20`;
      case 'completed': return `${base} bg-slate-200 text-slate-700 border-2 border-slate-300`;
      default: return `${base} bg-slate-100 text-slate-600 border-2 border-slate-200`;
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-clinical-rose" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans p-4 lg:p-8 gap-8 bg-slate-50">
      <aside className="w-full lg:w-80 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] bg-white rounded-3xl p-8 flex flex-col relative z-20 shadow-large border border-slate-200">
        <div className="flex items-center gap-4 mb-16 border-b-2 border-slate-200 pb-10">
          <div className="w-14 h-14 bg-clinical-rose rounded-2xl flex items-center justify-center shadow-rose">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">ADMIN<span className="text-clinical-rose">OS</span></h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">V3.5 Clinical</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-3">
          {[
            { id: 'Intelligence', icon: LayoutDashboard },
            { id: 'Bookings', icon: FlaskConical },
            { id: 'Specimens', icon: FlaskConical },
            { id: 'Partners', icon: HeartHandshake },
            { id: 'Coupons', icon: Ticket },
            { id: 'Config', icon: SettingsIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-clinical-rose text-white shadow-rose-lg' 
                  : 'text-slate-600 hover:text-clinical-rose hover:bg-clinical-rose-light'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.id}
            </button>
          ))}
        </nav>
        <div className="mt-10 pt-10 border-t-2 border-slate-200">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all text-slate-600 hover:text-clinical-rose hover:bg-clinical-rose-light">
            <Home className="w-5 h-5" /> Homepage
          </button>
          <button onClick={() => { localStorage.removeItem('pawar_lab_auth_token'); localStorage.removeItem('pawar_lab_user'); localStorage.removeItem('pawar_lab_user_role'); router.push('/login'); }} className="w-full mt-2 flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all text-slate-600 hover:text-clinical-rose hover:bg-clinical-rose-light">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
        <div className="bg-white rounded-3xl p-8 shadow-large border border-slate-200 space-y-8">
          <header className="flex justify-between items-center">
            <div>
              <span className="text-xs font-black text-clinical-rose uppercase tracking-wider mb-3 block">Node System Monitor</span>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">{activeTab}</h1>
            </div>
            <button onClick={fetchData} className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-clinical-rose-light transition-all shadow-medium border-2 border-slate-200 hover:border-clinical-rose">
              <RefreshCw className={`text-clinical-rose w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </header>

        <AnimatePresence mode="wait">
          {activeTab === 'Intelligence' && (
            <motion.div
              key="Intelligence"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <motion.div 
                className="card-premium p-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-4">Total Revenue</p>
                <p className="text-5xl font-black text-slate-900">₹{bookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0)}</p>
              </motion.div>
              <motion.div 
                className="card-premium p-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-warning text-xs font-black uppercase tracking-widest mb-4">Pending Approval</p>
                <p className="text-5xl font-black text-slate-900">{bookings.filter(b => b.status === 'pending').length}</p>
              </motion.div>
              <motion.div 
                className="card-premium p-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-success text-xs font-black uppercase tracking-widest mb-4">Completed Cycles</p>
                <p className="text-5xl font-black text-slate-900">{bookings.filter(b => b.status === 'completed').length}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'Bookings' && (
            <motion.div
              key="Bookings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
                initial="hidden"
                animate="show"
              >
                {bookings.filter(b => b.status !== 'completed').map((b, index) => (
                  <motion.div
                    key={b._id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 }
                    }}
                    className="card-premium p-8 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-slate-900 font-black text-xl">{b.patientName}</h3>
                      <span className={getStatusBadge(b.status)}>{b.status}</span>
                    </div>
                    <p className="text-slate-600 text-sm font-bold">{b.tests.map(t => t.title).join(' + ')}</p>
                    <div className="flex gap-8 text-slate-900 border-t-2 border-slate-200 pt-4 mt-2">
                      <div>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Total</p>
                        <p className="font-bold text-lg">₹{b.totalAmount}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Balance</p>
                        <p className="font-bold text-lg text-clinical-rose">₹{b.balanceAmount}</p>
                      </div>
                    </div>
                    {b.status === 'pending' && (
                      <button onClick={() => handleUpdateStatus(b._id, 'accepted')} className="mt-4 self-start bg-success/10 text-success px-6 py-3 rounded-xl font-bold text-xs hover:bg-success/20 transition-all border-2 border-success/20">
                        Approve Booking
                      </button>
                    )}
                    {b.status === 'report_uploaded' && b.reportFileUrl && (
                      <button 
                        onClick={() => handleOpenReview(b)} 
                        className="mt-4 self-start bg-clinical-rose/10 text-clinical-rose px-6 py-3 rounded-xl font-bold text-xs hover:bg-clinical-rose/20 transition-all border-2 border-clinical-rose/20 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Review Report
                      </button>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'Specimens' && (
            <motion.div
              key="Specimens"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="card-premium p-8 overflow-x-auto"
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-600">Patient</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-600">Tests</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-600">Status</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-slate-600">Assign Partner</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.filter(b => b.status === 'accepted' || b.status === 'assigned').map(b => (
                    <tr key={b._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{b.patientName}</td>
                      <td className="p-4 text-slate-600 text-sm">{b.tests.map(t => t.title).join(', ')}</td>
                      <td className="p-4">
                        <span className={getStatusBadge(b.status)}>{b.status}</span>
                        {b.assignedPartnerName && <p className="text-xs text-blue-600 mt-2 font-bold">{b.assignedPartnerName}</p>}
                      </td>
                      <td className="p-4">
                        <select 
                          onChange={(e) => handleUpdateStatus(b._id, 'assigned', { assignedPartnerName: e.target.value })}
                          className="bg-white border-2 border-slate-200 rounded-lg px-4 py-2 text-slate-900 font-bold w-full focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all"
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
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'Partners' && (
            <motion.div
              key="Partners"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <motion.div 
                className="card-premium p-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-2xl font-black text-slate-900 mb-8">Register New Partner</h3>
                <form onSubmit={handleAddPartner} className="space-y-6">
                  <input className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400" placeholder="Full Name" value={newPartner.name} onChange={e => setNewPartner({...newPartner, name: e.target.value})} />
                  <input className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400" placeholder="Email" type="email" value={newPartner.email} onChange={e => setNewPartner({...newPartner, email: e.target.value})} />
                  <input className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400" placeholder="Username" value={newPartner.username} onChange={e => setNewPartner({...newPartner, username: e.target.value})} />
                  <input className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400" placeholder="Password" type="password" value={newPartner.password} onChange={e => setNewPartner({...newPartner, password: e.target.value})} />
                  <button type="submit" className="w-full bg-clinical-rose text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-rose-lg hover:bg-clinical-rose-dark transition-all">Register</button>
                </form>
              </motion.div>
              <motion.div 
                className="card-premium p-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-2xl font-black text-slate-900 mb-8">Active Partners</h3>
                <div className="space-y-4">
                  {partners.map(p => (
                    <div key={p._id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border-2 border-slate-200">
                      <p className="font-bold text-slate-900 text-lg">{p.name}</p>
                      <p className="text-sm text-slate-600 font-bold uppercase">{p.operationalRole}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'Coupons' && (
            <motion.div
              key="Coupons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <motion.div 
                className="card-premium p-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-2xl font-black text-slate-900 mb-8">Create New Coupon</h3>
                <form onSubmit={handleAddCoupon} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Coupon Code</label>
                    <input 
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400 uppercase" 
                      placeholder="SAVE10" 
                      value={newCoupon.code} 
                      onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Discount Type</label>
                    <select
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all"
                      value={newCoupon.discountType}
                      onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value as 'percentage' | 'fixed'})}
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {newCoupon.discountType === 'percentage' ? 'Discount Percentage (0-100)' : 'Discount Amount (₹)'}
                    </label>
                    <input 
                      type="number"
                      min="0"
                      max={newCoupon.discountType === 'percentage' ? 100 : undefined}
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400" 
                      placeholder={newCoupon.discountType === 'percentage' ? '10' : '100'} 
                      value={newCoupon.value || ''} 
                      onChange={e => setNewCoupon({...newCoupon, value: parseFloat(e.target.value) || 0})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Expiry Date</label>
                    <input 
                      type="date"
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all" 
                      value={newCoupon.expiryDate} 
                      onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Usage Limit (Optional)</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400" 
                      placeholder="Leave empty for unlimited" 
                      value={newCoupon.usageLimit} 
                      onChange={e => setNewCoupon({...newCoupon, usageLimit: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full bg-clinical-rose text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-rose-lg hover:bg-clinical-rose-dark transition-all">Create Coupon</button>
                </form>
              </motion.div>
              <motion.div 
                className="card-premium p-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-2xl font-black text-slate-900 mb-8">Active Coupons</h3>
                <div className="space-y-4">
                  {coupons.length > 0 ? (
                    coupons.map(coupon => (
                      <div key={coupon._id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border-2 border-slate-200">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-black text-lg text-slate-900">{coupon.code}</p>
                            {new Date(coupon.expiryDate) < new Date() && (
                              <span className="text-xs font-bold text-clinical-rose uppercase">Expired</span>
                            )}
                            {!coupon.isActive && (
                              <span className="text-xs font-bold text-slate-500 uppercase">Inactive</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 font-bold">
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.value}% off` 
                              : `₹${coupon.value} off`}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                            {coupon.usageLimit && ` • Used: ${coupon.usedCount}/${coupon.usageLimit}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteCoupon(coupon._id)}
                          className="p-2 hover:bg-clinical-rose-light rounded-lg transition-colors ml-4"
                        >
                          <Trash2 className="text-slate-500 hover:text-clinical-rose" size={20} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p>No coupons created yet</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'Config' && (
            <motion.div
              key="Config"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="card-premium p-12 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
                  <Settings2 className="text-clinical-rose" size={28} /> Clinical Gateways
                </h3>
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-8 bg-slate-50 rounded-3xl border-2 border-slate-200">
                    <div>
                      <p className="text-slate-900 font-black text-lg">Pathologist Verification</p>
                      <p className="text-sm text-slate-600 font-medium mt-1">Require manual review before patient visibility.</p>
                    </div>
                    <button 
                      onClick={handleToggleConfig}
                      className={`w-16 h-8 rounded-full transition-all relative ${config.requireVerification ? 'bg-clinical-rose' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-medium ${config.requireVerification ? 'left-9' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="card-premium p-12 max-w-2xl mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
                  <Calendar className="text-clinical-rose" size={28} /> Clinical Calendar Management
                </h3>
                <form onSubmit={handleAddBlackout} className="space-y-4 mb-8">
                  <input 
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400"
                    placeholder="Reason (e.g., Diwali, Maintenance)"
                    value={newBlackout.reason}
                    onChange={e => setNewBlackout({...newBlackout, reason: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="date"
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all"
                      value={newBlackout.startDate}
                      onChange={e => setNewBlackout({...newBlackout, startDate: e.target.value})}
                    />
                    <input 
                      type="date"
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all"
                      value={newBlackout.endDate}
                      onChange={e => setNewBlackout({...newBlackout, endDate: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full bg-clinical-rose text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-rose-lg hover:bg-clinical-rose-dark transition-all">Add Block</button>
                </form>
                <div className="space-y-4">
                  {blackoutDates.map(date => (
                    <div key={date._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
                      <div>
                        <p className="font-bold text-slate-900">{date.reason}</p>
                        <p className="text-xs text-slate-600">{date.startDate} to {date.endDate}</p>
                      </div>
                      <button onClick={() => handleDeleteBlackout(date._id)} className="p-2 hover:bg-clinical-rose-light rounded-lg transition-colors">
                        <Trash2 className="text-slate-500 hover:text-clinical-rose" size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>

      {/* Review Report Modal */}
      <AnimatePresence>
        {reviewModalOpen && selectedBookingForReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => !isProcessingReview && setReviewModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-slate-200">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Review Report</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedBookingForReview.patientName} - {selectedBookingForReview.tests.map(t => t.title).join(' + ')}
                  </p>
                </div>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  disabled={isProcessingReview}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  <X className="w-6 h-6 text-slate-600" />
                </button>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-hidden p-6">
                {selectedBookingForReview.reportFileUrl ? (
                  <iframe
                    src={selectedBookingForReview.reportFileUrl}
                    className="w-full h-full min-h-[500px] border-2 border-slate-200 rounded-xl"
                    title="Report Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <p>No report file available</p>
                  </div>
                )}
              </div>

              {/* Modal Footer with Actions */}
              <div className="p-6 border-t-2 border-slate-200 space-y-4">
                {/* Reject Notes Input */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Rejection Notes (Required for Reject)
                  </label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="Enter notes for the partner about why the report is being rejected..."
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all resize-none"
                    rows={3}
                    disabled={isProcessingReview}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleReleaseReport}
                    disabled={isProcessingReview}
                    className="flex-1 bg-success text-white px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-success/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessingReview ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Release Report
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleRejectReport}
                    disabled={isProcessingReview || !rejectNotes.trim()}
                    className="flex-1 bg-clinical-rose text-white px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-clinical-rose-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessingReview ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        Reject / Re-upload
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}