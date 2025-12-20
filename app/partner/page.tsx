
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, CheckCircle, Upload, MapPin, Package, LogOut, Search, Plus, X, FlaskConical, Loader2 } from 'lucide-react';

export default function PartnerPage() {
  const router = useRouter();
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', testTitle: 'General Profile' });
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const res = await fetch('/api/bookings');
    if (res.ok) setAllBookings(await res.json());
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    // If pending -> Mark collected
    if (currentStatus === 'pending') {
      await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sample_collected' })
      });
      fetchBookings();
    }
    // If sample_collected -> Trigger file upload input
    else if (currentStatus === 'sample_collected') {
      document.getElementById(`file-upload-${id}`)?.click();
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
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        body: formData, // No Content-Type header needed, browser sets boundary
      });
      if (res.ok) fetchBookings();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const filtered = allBookings.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b._id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Package className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-lg leading-tight">PARTNER HUB</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global Management Panel</p>
          </div>
        </div>
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-red-600 flex items-center gap-2 font-bold text-sm transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </nav>

      <main className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black text-gray-900">System Overview</h2>
            <p className="text-gray-500 font-medium">Manage patients and reports</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search patient..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Disabled Register for now as it needs POST implementation matching schema */}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filtered.map(task => (
            <div key={task._id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-red-100 transition-all group">
              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      task.status === 'completed' ? 'bg-green-100 text-green-600' :
                      task.status === 'report_uploaded' ? 'bg-amber-100 text-amber-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-gray-300 font-bold">#{task._id.slice(-6)}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{task.patientName}</h3>
                </div>
                
                <div className="flex flex-col justify-center min-w-[220px] gap-3">
                  {task.status === 'pending' && (
                    <button 
                      onClick={() => handleUpdateStatus(task._id, task.status)}
                      className="w-full py-4 bg-gray-900 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-2 hover:bg-red-600 shadow-lg"
                    >
                      <CheckCircle className="w-5 h-5" /> Collect Sample
                    </button>
                  )}

                  {task.status === 'sample_collected' && (
                    <>
                      <input 
                        type="file" 
                        id={`file-upload-${task._id}`} 
                        className="hidden" 
                        accept="application/pdf"
                        onChange={(e) => handleFileUpload(e, task._id)}
                      />
                      <button 
                        onClick={() => handleUpdateStatus(task._id, task.status)}
                        disabled={uploadingId === task._id}
                        className="w-full py-4 bg-red-600 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-2 hover:bg-red-700 shadow-lg disabled:opacity-70"
                      >
                        {uploadingId === task._id ? <Loader2 className="animate-spin" /> : <Upload className="w-5 h-5" />} 
                        {uploadingId === task._id ? 'Uploading...' : 'Upload PDF'}
                      </button>
                    </>
                  )}

                  {(task.status === 'report_uploaded' || task.status === 'completed') && (
                     <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-center font-bold text-sm border border-green-100 flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Processing Complete
                     </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
