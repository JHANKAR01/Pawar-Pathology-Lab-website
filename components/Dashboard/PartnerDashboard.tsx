import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, CheckCircle, Upload, MapPin, Phone, User, LogOut, Package, Search, Plus, X, FlaskConical, DollarSign, Navigation 
} from 'lucide-react';
import { Booking, BookingStatus, CollectionType } from '../../types';
import { mockApi } from '../../lib/mockApi';

const PartnerDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [tasks, setTasks] = useState<Booking[]>([]);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', testTitle: 'General Profile', amountTaken: 0, totalAmount: 500 });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const all = mockApi.getBookings();
    setTasks(all.filter(b => [BookingStatus.ASSIGNED, BookingStatus.REACHED, BookingStatus.SAMPLE_COLLECTED, BookingStatus.REPORT_UPLOADED].includes(b.status)));
  };

  const handleUpdateStatus = (id: string, status: BookingStatus) => {
    if (status === BookingStatus.SAMPLE_COLLECTED && !window.confirm('Safety Check: Confirm specimen acquisition from correct patient?')) return;
    mockApi.updateBookingStatus(id, status);
    refreshData();
  };

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    mockApi.saveBooking({
      patientName: newPatient.name,
      contactNumber: newPatient.phone,
      tests: [{ id: 'direct', title: newPatient.testTitle, category: 'General', price: newPatient.totalAmount, description: 'Direct Entry', isHomeCollectionAvailable: true, fastingRequired: false }],
      totalAmount: newPatient.totalAmount,
      amountTaken: newPatient.amountTaken,
      balanceAmount: newPatient.totalAmount - newPatient.amountTaken,
      collectionType: CollectionType.LAB_VISIT,
      scheduledDate: new Date().toISOString(),
      status: BookingStatus.SAMPLE_COLLECTED
    });
    setIsRegisterOpen(false);
    refreshData();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center"><Package className="text-white w-6 h-6" /></div>
          <div>
            <h1 className="font-black text-lg leading-tight">FIELD OPS HUB</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Diagnostic Logistics Node</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsRegisterOpen(true)} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2"><Plus size={16} /> Direct Entry</button>
          <button onClick={onLogout} className="text-gray-400 hover:text-red-600 font-bold text-sm flex items-center gap-2"><LogOut className="w-4 h-4" /> Exit</button>
        </div>
      </nav>

      <main className="p-8 max-w-5xl mx-auto w-full">
        <div className="mb-12">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Active Dispatches</h2>
          <p className="text-gray-500 font-medium">Specimen acquisition queue for today.</p>
        </div>

        <div className="space-y-6">
          {tasks.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
              <ClipboardList className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold">No tasks assigned to your node.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-8 items-center">
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-4 py-1.5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">{task.status.replace('_', ' ')}</span>
                    <span className="text-[10px] text-gray-300 font-bold">#{task.id}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{task.patientName}</h3>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500 mb-4">
                    <div className="flex items-center gap-2"><MapPin size={14} className="text-red-500" /> {task.address || 'Lab Visit'}</div>
                    <div className="flex items-center gap-2"><Phone size={14} className="text-green-500" /> {task.contactNumber || 'N/A'}</div>
                  </div>
                  {task.balanceAmount > 0 && <div className="inline-flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-xl text-rose-600 font-black text-[10px] uppercase tracking-widest"><DollarSign size={14} /> Collect Balance: ₹{task.balanceAmount}</div>}
                </div>
                
                <div className="flex flex-col gap-3 min-w-[200px]">
                  {task.status === BookingStatus.ASSIGNED && (
                    <>
                      {task.coordinates && (
                        <a href={`https://www.google.com/maps?q=${task.coordinates.lat},${task.coordinates.lng}`} target="_blank" className="w-full py-4 bg-white border border-gray-200 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm"><Navigation size={18} className="text-blue-500" /> Navigate</a>
                      )}
                      <button onClick={() => handleUpdateStatus(task.id, BookingStatus.REACHED)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm">Reached Site</button>
                    </>
                  )}
                  {task.status === BookingStatus.REACHED && (
                    <button onClick={() => handleUpdateStatus(task.id, BookingStatus.SAMPLE_COLLECTED)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm">Collect Sample</button>
                  )}
                  {task.status === BookingStatus.SAMPLE_COLLECTED && (
                    <button className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2"><Upload size={18} /> Upload Report</button>
                  )}
                  {task.status === BookingStatus.REPORT_UPLOADED && (
                    <div className="text-center font-black text-amber-500 text-[10px] uppercase tracking-widest p-4 bg-amber-50 rounded-2xl">Awaiting Verification</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {isRegisterOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
              <div><h3 className="text-2xl font-black">Direct Intake</h3><p className="text-slate-400 font-medium tracking-tight">Walk-in Specimen Registration</p></div>
              <button onClick={() => setIsRegisterOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleRegisterPatient} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Patient Name" className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
                <input required placeholder="Phone" className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})} />
              </div>
              <input required placeholder="Investigation Panel" className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none" value={newPatient.testTitle} onChange={e => setNewPatient({...newPatient, testTitle: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Total Bill</label><input type="number" className="w-full bg-slate-100 p-4 rounded-xl font-black text-xl" value={newPatient.totalAmount} onChange={e => setNewPatient({...newPatient, totalAmount: Number(e.target.value)})} /></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Amount Collected</label><input type="number" className="w-full bg-slate-100 p-4 rounded-xl font-black text-xl text-emerald-600" value={newPatient.amountTaken} onChange={e => setNewPatient({...newPatient, amountTaken: Number(e.target.value)})} /></div>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl flex justify-between items-center font-black uppercase text-xs text-rose-600"><span>Pending Balance:</span><span>₹{newPatient.totalAmount - newPatient.amountTaken}</span></div>
              <button type="submit" className="w-full bg-rose-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-xl">Confirm & Log Specimen</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;