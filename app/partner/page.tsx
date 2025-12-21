'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, Upload, MapPin, Package, LogOut, Loader2, Navigation, ClipboardList, RefreshCw, Plus, X, Phone, DollarSign
} from 'lucide-react';
import { BookingStatus } from '@/types';

export default function PartnerPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  
  // Walk-in Form State
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    testTitle: 'CBC - Hematology Profile',
    totalAmount: 350,
    amountTaken: 0
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('pawar_lab_auth_token') || '{}');
    if (user?.role !== 'partner') {
      router.push(user?.role === 'admin' ? '/admin' : '/login');
    }
    fetchBookings();
  }, [router]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        // For the demo, we show tasks assigned or in progress
        setTasks(data.filter((b: any) => 
          ['assigned', 'reached', 'sample_collected', 'report_uploaded', 'completed'].includes(b.status)
        ));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string, extraData: object = {}) => {
    const originalTasks = tasks;
    setTasks(prev => prev.map(task => 
      task._id === id ? { ...task, status: newStatus, ...extraData } : task
    ));

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, ...extraData })
      });
      if (!res.ok) {
        throw new Error('Failed to update status');
      }
      const updatedBooking = await res.json();
      setTasks(prev => prev.map(task => task._id === id ? updatedBooking : task));
    } catch (err) {
      console.error(err);
      alert('Failed to update status. Reverting changes.');
      setTasks(originalTasks); // Rollback
    }
  };

  const handleCollectSample = async (id: string) => {
    if (window.confirm('Safety Check: Confirm specimen acquisition for this patient?')) {
      handleUpdateStatus(id, 'sample_collected');
    }
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
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error('Failed to register walk-in');
      }
      const createdBooking = await res.json();
      setTasks(prev => prev.map(task => task._id === tempId ? createdBooking : task)); // Replace optimistic with real
      setIsRegisterOpen(false);
      setNewPatient({ name: '', phone: '', email: '', testTitle: 'CBC - Hematology Profile', totalAmount: 350, amountTaken: 0 });
      alert('Walk-in patient registered and specimen logged.');
    } catch (err) {
      console.error(err);
      alert('Failed to register walk-in. Reverting changes.');
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
      const res = await fetch(`/api/bookings/${id}`, { method: 'PATCH', body: formData });
      if (!res.ok) {
        throw new Error('Upload failed');
      }
      const updatedBooking = await res.json();
      setTasks(prev => prev.map(task => task._id === id ? updatedBooking : task));
    } catch (err) { 
      console.error(err);
      alert('Upload failed. Reverting changes.');
      setTasks(originalTasks); // Rollback
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Package className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg uppercase tracking-tight">FIELD OPS HUB</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Secure Logistics Node</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
          >
            <Plus size={16} /> Direct Add
          </button>
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-red-600 font-bold text-sm flex items-center gap-2 transition-colors">
            <LogOut className="w-4 h-4" /> Exit
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-5xl mx-auto w-full">
        <div className="mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Assigned Tasks</h2>
            <p className="text-gray-500 font-medium">Specimens requiring immediate clinical acquisition.</p>
          </div>
          <button onClick={fetchBookings} className="p-3 bg-white border border-gray-100 rounded-full hover:bg-gray-50 shadow-sm">
            <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-6">
          {tasks.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
              <ClipboardList className="w-16 h-16 text-gray-100 mb-4" />
              <p className="text-gray-400 font-bold">No active collections assigned.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task._id} className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-8 items-center">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      task.status === 'sample_collected' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-gray-300 font-bold tracking-widest uppercase">NODE: {task._id.slice(-6)}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{task.patientName}</h3>
                  <div className="flex gap-2 mb-6">
                    {task.tests?.map((t: any) => (
                      <span key={t.id} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-600">{t.title}</span>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 text-sm font-bold bg-slate-50 p-3 rounded-xl inline-flex">
                      <MapPin className="w-4 h-4 text-red-500" />
                      {task.address || "Flagship Center Lab Visit"}
                    </div>
                    {task.balanceAmount > 0 && (
                       <div className="flex items-center gap-2 text-rose-600 text-xs font-black uppercase tracking-widest bg-rose-50 p-3 rounded-xl inline-flex ml-3">
                          <DollarSign size={14} /> Balance: ₹{task.balanceAmount}
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
                          className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 text-gray-900 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50"
                        >
                          <Navigation className="w-5 h-5 text-blue-500" /> Navigate
                        </a>
                      )}
                      <button 
                        onClick={() => handleUpdateStatus(task._id, 'reached')}
                        className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-xl"
                      >
                         Reached Site
                      </button>
                    </>
                  )}

                  {task.status === 'reached' && (
                    <button 
                      onClick={() => handleCollectSample(task._id)}
                      className="flex items-center gap-3 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-xl"
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
                        className="flex items-center gap-3 px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-xl"
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
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
              <div>
                 <h3 className="text-2xl font-black uppercase tracking-tight">Direct Entry</h3>
                 <p className="text-slate-400 font-medium">Walk-in or Immediate acquisition</p>
              </div>
              <button onClick={() => setIsRegisterOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleWalkInRegistration} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Name</label>
                    <input required className="w-full bg-slate-50 p-4 rounded-xl outline-none font-bold" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Phone</label>
                    <input required className="w-full bg-slate-50 p-4 rounded-xl outline-none font-bold" value={newPatient.phone} maxLength={10} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} />
                 </div>
              </div>
              
              <div>
                 <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Email Address (Optional)</label>
                 <input className="w-full bg-slate-50 p-4 rounded-xl outline-none font-bold" placeholder="For reporting" value={newPatient.email} onChange={e => setNewPatient({...newPatient, email: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Investigation Panel</label>
                <input className="w-full bg-slate-50 p-4 rounded-xl outline-none font-bold" value={newPatient.testTitle} onChange={e => setNewPatient({...newPatient, testTitle: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Total Bill</label>
                    <input type="number" className="w-full bg-white p-4 rounded-xl outline-none font-black text-xl" value={newPatient.totalAmount} onChange={e => setNewPatient({...newPatient, totalAmount: Number(e.target.value)})} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Amount Taken</label>
                    <input type="number" className="w-full bg-white p-4 rounded-xl outline-none font-black text-xl text-emerald-600" value={newPatient.amountTaken} onChange={e => setNewPatient({...newPatient, amountTaken: Number(e.target.value)})} />
                 </div>
              </div>
              <div className="flex justify-between items-center font-black uppercase text-xs p-4 border-2 border-dashed border-slate-100 rounded-2xl">
                 <span className="text-slate-400">Balance Calculated:</span>
                 <span className="text-rose-600 text-lg">₹{newPatient.totalAmount - newPatient.amountTaken}</span>
              </div>
              <button className="w-full bg-rose-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-900/20">Confirm & Log Specimen</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}