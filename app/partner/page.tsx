
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, Upload, MapPin, Package, LogOut, Search, 
  FlaskConical, Loader2, Navigation, AlertTriangle, ClipboardList,
  Check, Phone, Info, RefreshCw
} from 'lucide-react';

export default function PartnerPage() {
  const router = useRouter();
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const res = await fetch('/api/bookings');
    if (res.ok) {
      const data = await res.json();
      // Only show items assigned to field ops
      setAllBookings(data.filter((b: any) => 
        ['assigned', 'reached', 'sample_collected', 'report_uploaded'].includes(b.status)
      ));
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) fetchBookings();
  };

  const handleCollectSample = (id: string) => {
    if (window.confirm('Confirm specimen acquisition? This initiates the clinical transport cycle.')) {
      handleUpdateStatus(id, 'sample_collected');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingId(id);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('status', 'report_uploaded');
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'PATCH', body: formData });
      if (res.ok) fetchBookings();
    } catch (err) {
      alert('Clinical record upload failed.');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <Package className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg">FIELD OPERATIONS</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">NABL Logistics Node</p>
          </div>
        </div>
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-red-600 font-bold text-sm flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Exit Workspace
        </button>
      </nav>

      <main className="p-8 max-w-5xl mx-auto w-full">
        <div className="mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Assigned Dispatch</h2>
            <p className="text-gray-500 font-medium">Maintain biosafety standards during specimen acquisition.</p>
          </div>
          <button onClick={fetchBookings} className="p-3 bg-white border border-gray-100 rounded-full hover:bg-gray-50 shadow-sm">
            <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-6">
          {allBookings.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
              <ClipboardList className="w-16 h-16 text-gray-100 mb-4" />
              <p className="text-gray-400 font-bold">No active collections assigned.</p>
            </div>
          ) : (
            allBookings.map(task => (
              <div key={task._id} className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-8 items-center group hover:border-red-500/20 transition-all">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      task.status === 'sample_collected' ? 'bg-amber-100 text-amber-600' : 
                      task.status === 'reached' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-gray-300 font-bold tracking-widest uppercase">Node: {task._id.slice(-6)}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{task.patientName}</h3>
                  
                  <div className="mb-6">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Requested Analysis</p>
                     <div className="flex flex-wrap gap-2">
                        {task.tests.map((t: any) => (
                          <span key={t.id} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold text-slate-600">{t.title}</span>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-700 text-sm font-bold bg-slate-50 p-3 rounded-xl inline-flex">
                      <MapPin className="w-4 h-4 text-red-500" />
                      {task.address || "Link Road Flagship Center"}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                  {task.status === 'assigned' && (
                    <>
                      {task.coordinates && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${task.coordinates.lat},${task.coordinates.lng}`}
                          target="_blank"
                          className="flex items-center gap-3 px-6 py-4 bg-white border border-gray-100 text-gray-900 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all"
                        >
                          <Navigation className="w-5 h-5 text-blue-500" /> Navigate
                        </a>
                      )}
                      <button 
                        onClick={() => handleUpdateStatus(task._id, 'reached')}
                        className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-red-600"
                      >
                         Reached Site
                      </button>
                    </>
                  )}

                  {task.status === 'reached' && (
                    <button 
                      onClick={() => handleCollectSample(task._id)}
                      className="flex items-center gap-3 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-emerald-700"
                    >
                      <CheckCircle className="w-5 h-5" /> Acquired Specimen
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
                        disabled={uploadingId === task._id}
                        className="flex items-center gap-3 px-8 py-4 bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-rose-700 disabled:opacity-50"
                      >
                        {uploadingId === task._id ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />} 
                        Upload Analysis PDF
                      </button>
                    </>
                  )}

                  {task.status === 'report_uploaded' && (
                     <div className="flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-bold text-sm border border-emerald-100">
                        <Info className="w-5 h-5" /> Lab Review in Progress
                     </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
