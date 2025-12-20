
import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Upload, MapPin, Phone, User, LogOut, Package, Search, Plus, X, FlaskConical } from 'lucide-react';
import { Booking, BookingStatus, CollectionType } from '../../types';
import { mockApi } from '../../lib/mockApi';

const PartnerDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', testTitle: 'General Profile' });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setAllBookings(mockApi.getBookings());
  };

  const handleUpdateStatus = (id: string, currentStatus: BookingStatus) => {
    let nextStatus = currentStatus;
    if (currentStatus === BookingStatus.PENDING) nextStatus = BookingStatus.SAMPLE_COLLECTED;
    else if (currentStatus === BookingStatus.SAMPLE_COLLECTED) nextStatus = BookingStatus.REPORT_UPLOADED;
    
    mockApi.updateBookingStatus(id, nextStatus);
    refreshData();
  };

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    mockApi.saveBooking({
      patientName: newPatient.name,
      tests: [{ id: '99', title: newPatient.testTitle, category: 'Manual', price: 0, description: 'Added by Partner', isHomeCollectionAvailable: true, fastingRequired: false }],
      totalAmount: 0,
      collectionType: CollectionType.LAB_VISIT,
      scheduledDate: new Date().toISOString(),
      status: BookingStatus.PENDING
    });
    setIsRegisterOpen(false);
    refreshData();
  };

  const filtered = allBookings.filter(b => 
    b.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="flex items-center gap-6">
          <button onClick={onLogout} className="text-gray-400 hover:text-red-600 flex items-center gap-2 font-bold text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black text-gray-900">System Overview</h2>
            <p className="text-gray-500 font-medium">Manage patients and reports across all locations</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search patient or ID..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsRegisterOpen(true)}
              className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-600 shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" /> Register Patient
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filtered.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
              <ClipboardList className="w-16 h-16 text-gray-200 mx-auto mb-6" />
              <p className="text-gray-400 font-bold text-lg">No records found matching your search.</p>
            </div>
          ) : (
            filtered.reverse().map(task => (
              <div key={task.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-red-100 transition-all group">
                <div className="flex flex-col md:flex-row justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        task.status === BookingStatus.COMPLETED ? 'bg-green-100 text-green-600' :
                        task.status === BookingStatus.REPORT_UPLOADED ? 'bg-amber-100 text-amber-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-300 font-bold">#{task.id}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{task.patientName}</h3>
                    <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-500">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg"><MapPin className="w-4 h-4 text-red-500" /> Betul Center</div>
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg"><FlaskConical className="w-4 h-4 text-blue-500" /> {task.tests.length} Tests</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-center min-w-[220px] gap-3">
                    {task.status === BookingStatus.PENDING || task.status === BookingStatus.SAMPLE_COLLECTED ? (
                      <button 
                        onClick={() => handleUpdateStatus(task.id, task.status)}
                        className="w-full py-4 bg-gray-900 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-2 hover:bg-red-600 shadow-lg shadow-gray-200 hover:shadow-red-200 transition-all active:scale-95"
                      >
                        {task.status === BookingStatus.PENDING ? (
                          <><CheckCircle className="w-5 h-5" /> Collect Sample</>
                        ) : (
                          <><Upload className="w-5 h-5" /> Upload Report</>
                        )}
                      </button>
                    ) : task.status === BookingStatus.REPORT_UPLOADED ? (
                      <div className="bg-amber-50 text-amber-600 p-4 rounded-2xl text-center font-bold text-sm border border-amber-100">
                        Awaiting Admin Review
                      </div>
                    ) : (
                      <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-center font-bold text-sm border border-green-100 flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" /> Final Report Live
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-red-600 p-10 text-white relative">
              <button onClick={() => setIsRegisterOpen(false)} className="absolute top-6 right-6 hover:rotate-90 transition-transform"><X /></button>
              <h3 className="text-2xl font-black">Register New Patient</h3>
              <p className="text-red-100 font-medium">Add patient directly to system pool</p>
            </div>
            <form onSubmit={handleRegisterPatient} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Patient Name</label>
                <input required className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Primary Test</label>
                <input required className="w-full px-6 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none font-bold" value={newPatient.testTitle} onChange={e => setNewPatient({...newPatient, testTitle: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black hover:bg-red-600 transition-all shadow-xl">Complete Registration</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;
