'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  CheckCircle, Upload, MapPin, Package, LogOut, Loader2, Navigation, ClipboardList, RefreshCw, Plus, X, Phone, DollarSign
} from 'lucide-react';
import { BookingStatus } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import PaginationControls from '@/components/ui/PaginationControls';
import CustomModal from '@/components/ui/CustomModal';

export default function PartnerPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  // Filters
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Removed client-side filteredTasks logic. We will fetch directly.


  // Walk-in Form State
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    testTitle: 'CBC - Hematology Profile',
    totalAmount: 350,
    amountTaken: 0
  });

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const role = session?.user?.role?.toLowerCase();
    if (role === 'partner') {
      setIsVerified(true);
      fetchBookings();
    } else if (role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/login');
    }
  }, [session, status, router, currentPage, limit, statusFilter]); // Trigger on simple state changes

  // Debounced Search Re-fetch
  useEffect(() => {
    if (isVerified) {
      const timer = setTimeout(() => {
        setCurrentPage(1); // Reset page on search
        fetchBookings();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        // Map 'active'/'completed' to what API expects if needed, or API handles 'active'/'completed' string directly
        statusTab: statusFilter === 'active' ? 'active' : 'completed',
        search: searchQuery
      });
      const res = await fetch(`/api/bookings?${query}`);
      if (res.ok) {
        const data = await res.json();
        // Handle breaking change
        let bookings: any[] = [];
        if (Array.isArray(data)) {
          bookings = data;
        } else {
          bookings = data.bookings;
          setPaginationMeta(data.metadata);
        }

        // Use data directly
        setTasks(bookings);
        if (statusFilter === 'active' && bookings.length === 0 && searchQuery === '') {
          // Optional: could handle empty states better
        }
      } else if (res.status === 401 || res.status === 403) {
        router.push('/login');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };
  // Re-fetch when items changed
  useEffect(() => {
    if (status === 'authenticated') {
      fetchBookings();
    }
  }, [currentPage, limit]);

  const handleUpdateStatus = async (id: string, newStatus: string, extraData: object = {}) => {
    const originalTasks = tasks;
    setTasks(prev => prev.map(task =>
      task._id === id ? { ...task, status: newStatus, ...extraData } : task
    ));

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, ...extraData })
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) router.push('/login');
        throw new Error('Failed to update status');
      }
      const updatedBooking = await res.json();
      setTasks(prev => prev.map(task => task._id === id ? updatedBooking : task));
    } catch (err) {
      console.error(err);
      setTasks(originalTasks); // Rollback
      toast.error('Failed to update status. Reverting changes.');
    }
  };

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: '', type: '' }); // type: 'collect'

  const handleCollectSample = async (id: string) => {
    setConfirmModal({ isOpen: true, id, type: 'collect' });
  };

  const confirmAction = () => {
    if (confirmModal.type === 'collect') {
      handleUpdateStatus(confirmModal.id, 'sample_collected');
    }
    setConfirmModal({ isOpen: false, id: '', type: '' });
  };

  const handleWalkInRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const balance = newPatient.totalAmount - newPatient.amountTaken;

    // Optimistic update - create a temporary ID for the new task
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      _id: tempId,
      patientName: newPatient.name,
      contactNumber: newPatient.phone,
      email: newPatient.email,
      tests: [{ title: newPatient.testTitle, price: newPatient.totalAmount, category: 'General', id: 'temp-test' }],
      totalAmount: newPatient.totalAmount,
      amountTaken: newPatient.amountTaken,
      balanceAmount: balance,
      collectionType: 'lab_visit',
      scheduledDate: new Date().toISOString(),
      status: 'sample_collected',
      paymentMode: 'cash',
      paymentStatus: balance === 0 ? 'paid' : 'unpaid',
      bookedByEmail: 'partner-direct'
    };
    setTasks(prev => [optimisticTask, ...prev]);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientName: newPatient.name,
          contactNumber: newPatient.phone,
          email: newPatient.email,
          tests: [{ title: newPatient.testTitle, price: newPatient.totalAmount, category: 'General' }],
          totalAmount: newPatient.totalAmount,
          amountTaken: newPatient.amountTaken,
          balanceAmount: balance,
          collectionType: 'lab_visit',
          scheduledDate: new Date().toISOString(),
          status: 'sample_collected',
          paymentMode: 'cash',
          paymentStatus: balance === 0 ? 'paid' : 'unpaid',
          bookedByEmail: 'partner-direct'
        })
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) router.push('/login');
        throw new Error('Failed to register walk-in');
      }
      const createdBooking = await res.json();
      setTasks(prev => prev.map(task => task._id === tempId ? createdBooking : task)); // Replace optimistic with real
      setIsRegisterOpen(false);
      setNewPatient({ name: '', phone: '', email: '', testTitle: 'CBC - Hematology Profile', totalAmount: 350, amountTaken: 0 });
      toast.success('Walk-in patient registered and specimen logged.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to register walk-in. Reverting changes.');
      setTasks(prev => prev.filter(task => task._id !== tempId)); // Rollback optimistic update
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const originalTasks = tasks;
    setTasks(prev => prev.map(task =>
      task._id === id ? { ...task, status: 'report_uploaded', reportFileUrl: 'uploading...' } : task // Optimistic update
    ));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('status', 'report_uploaded');
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        body: formData
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) router.push('/login');
        throw new Error('Upload failed');
      }
      const updatedBooking = await res.json();
      setTasks(prev => prev.map(task => task._id === id ? updatedBooking : task));
    } catch (err) {
      console.error(err);
      toast.error('Upload failed. Reverting changes.');
      setTasks(originalTasks); // Rollback
    }
  };

  if (!isVerified || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <div className="bg-white border-b-2 border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-50">
          <Skeleton className="h-14 w-48 rounded-2xl" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-32 rounded-xl" />
            <Skeleton className="h-12 w-24 rounded-xl" />
          </div>
        </div>
        <main className="p-8 max-w-5xl mx-auto w-full space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64 rounded-lg" />
              <Skeleton className="h-4 w-96 rounded" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-12 w-48 rounded-xl" />
              <Skeleton className="h-12 w-24 rounded-xl" />
            </div>
          </div>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <nav className="bg-white border-b-2 border-slate-200 px-8 py-5 flex justify-between items-center sticky top-0 z-50 shadow-medium">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-clinical-rose rounded-2xl flex items-center justify-center shadow-rose">
            <Package className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="font-black text-xl uppercase tracking-tight text-slate-900">FIELD OPS HUB</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Secure Logistics Node</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 bg-clinical-rose text-white px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest shadow-rose-lg hover:bg-clinical-rose-dark transition-all"
          >
            <Plus size={18} /> Direct Add
          </button>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-slate-600 hover:text-clinical-rose font-bold text-sm flex items-center gap-2 transition-colors px-4 py-2 rounded-xl hover:bg-clinical-rose-light">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-5xl mx-auto w-full">
        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Assigned Tasks</h2>
            <p className="text-slate-600 font-medium mt-2">Specimens requiring immediate clinical acquisition.</p>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Search patient or ID..."
              className="px-5 py-3 rounded-xl text-sm font-bold bg-white text-slate-900 border-2 border-slate-200 focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${statusFilter === 'active'
                ? 'bg-clinical-rose text-white shadow-rose-lg'
                : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-clinical-rose'
                }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${statusFilter === 'completed'
                ? 'bg-clinical-rose text-white shadow-rose-lg'
                : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-clinical-rose'
                }`}
            >
              Completed
            </button>
            <button onClick={fetchBookings} className="p-3 bg-white border-2 border-slate-200 rounded-xl hover:bg-clinical-rose-light hover:border-clinical-rose shadow-soft transition-all">
              <RefreshCw className={`w-5 h-5 text-clinical-rose ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={paginationMeta.totalPages}
          limit={limit}
          total={paginationMeta.total}
          onPageChange={setCurrentPage}
          onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
        />

        <div className="space-y-6">
          {tasks.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center">
              <ClipboardList className="w-20 h-20 text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold text-lg">No active collections assigned.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task._id} className="card-premium p-10 flex flex-col md:flex-row justify-between gap-8 items-center">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 ${task.status === 'sample_collected'
                      ? 'bg-warning/10 text-warning border-warning/20'
                      : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">NODE: {task._id.slice(-6)}</span>
                  </div>

                  <h3 className="text-3xl font-black text-slate-900 mb-3">{task.patientName}</h3>
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {task.tests?.map((t: any) => (
                      <span key={t.id} className="px-4 py-2 bg-clinical-rose-light border-2 border-clinical-rose/20 rounded-xl text-sm font-bold text-clinical-rose">{t.title}</span>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-700 text-sm font-bold bg-slate-50 p-4 rounded-xl inline-flex border-2 border-slate-200">
                      <MapPin className="w-5 h-5 text-clinical-rose" />
                      {task.address || "Flagship Center Lab Visit"}
                    </div>
                    {task.balanceAmount > 0 && (
                      <div className="flex items-center gap-2 text-clinical-rose text-sm font-black uppercase tracking-widest bg-clinical-rose-light p-4 rounded-xl inline-flex ml-3 border-2 border-clinical-rose/20">
                        <DollarSign size={16} /> Balance: ₹{task.balanceAmount}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                  {task.status === 'assigned' && (
                    <>
                      {task.coordinates && (
                        <a
                          href={`http://www.google.com/maps/search/?api=1&query=${task.coordinates.lat},${task.coordinates.lng}`}
                          target="_blank"
                          className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-200 text-slate-900 rounded-2xl font-bold text-sm shadow-soft hover:bg-clinical-rose-light hover:border-clinical-rose transition-all"
                        >
                          <Navigation className="w-5 h-5 text-clinical-rose" /> Navigate
                        </a>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(task._id, 'reached')}
                        className="flex items-center gap-3 px-8 py-4 bg-clinical-rose text-white rounded-2xl font-bold text-sm shadow-rose-lg hover:bg-clinical-rose-dark transition-all"
                      >
                        Reached Site
                      </button>
                    </>
                  )}

                  {task.status === 'reached' && (
                    <button
                      onClick={() => handleCollectSample(task._id)}
                      className="flex items-center gap-3 px-10 py-4 bg-success text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-success/90 transition-all"
                    >
                      Collect Specimen
                    </button>
                  )}

                  {task.status === 'sample_collected' && (
                    <>
                      <input
                        type="file"
                        id={`file-${task._id}`}
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, task._id)}
                      />
                      <button
                        onClick={() => document.getElementById(`file-${task._id}`)?.click()}
                        className="flex items-center gap-3 px-8 py-4 bg-clinical-rose text-white rounded-2xl font-bold text-sm shadow-rose-lg hover:bg-clinical-rose-dark transition-all"
                      >
                        <Upload size={18} /> Upload Analysis PDF
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {isRegisterOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-slate-200">
            <div className="bg-gradient-to-r from-clinical-rose to-clinical-rose-dark p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Direct Entry</h3>
                <p className="text-rose-100 font-medium">Walk-in or Immediate acquisition</p>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleWalkInRegistration} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-black uppercase text-slate-600 mb-2 block">Name</label>
                  <input required className="w-full bg-white border-2 border-slate-200 p-4 rounded-xl outline-none font-bold text-slate-900 focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-600 mb-2 block">Phone</label>
                  <input required className="w-full bg-white border-2 border-slate-200 p-4 rounded-xl outline-none font-bold text-slate-900 focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all" value={newPatient.phone} maxLength={10} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-600 mb-2 block">Email Address (Optional)</label>
                <input className="w-full bg-white border-2 border-slate-200 p-4 rounded-xl outline-none font-bold text-slate-900 focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all placeholder:text-slate-400" placeholder="For reporting" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-600 mb-2 block">Investigation Panel</label>
                <input className="w-full bg-white border-2 border-slate-200 p-4 rounded-xl outline-none font-bold text-slate-900 focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all" value={newPatient.testTitle} onChange={e => setNewPatient({ ...newPatient, testTitle: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border-2 border-slate-200">
                <div>
                  <label className="text-xs font-black uppercase text-slate-600 mb-2 block">Total Bill</label>
                  <input type="number" className="w-full bg-white border-2 border-slate-200 p-4 rounded-xl outline-none font-black text-xl text-slate-900 focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 transition-all" value={newPatient.totalAmount} onChange={e => setNewPatient({ ...newPatient, totalAmount: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-600 mb-2 block">Amount Taken</label>
                  <input type="number" className="w-full bg-white border-2 border-slate-200 p-4 rounded-xl outline-none font-black text-xl text-success focus:border-success focus:ring-2 focus:ring-success/20 transition-all" value={newPatient.amountTaken} onChange={e => setNewPatient({ ...newPatient, amountTaken: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-between items-center font-black uppercase text-sm p-5 border-2 border-slate-200 rounded-2xl bg-slate-50">
                <span className="text-slate-600">Balance Calculated:</span>
                <span className="text-clinical-rose text-xl">₹{newPatient.totalAmount - newPatient.amountTaken}</span>
              </div>
              <button className="w-full bg-clinical-rose text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-rose-lg hover:bg-clinical-rose-dark transition-all">Confirm & Log Specimen</button>
            </form>
          </div>
        </div>
      )}

      <CustomModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: '', type: '' })}
        onConfirm={confirmAction}
        title="Confirm Action"
        description="Are you sure you want to proceed with this action?"
        confirmText="Confirm"
        variant="default"
      />
    </div>
  );
}
