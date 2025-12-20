
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, FlaskConical, FileText, Plus, DollarSign, Clock, AlertCircle, Home, HeartHandshake, Settings, CheckCircle } from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { mockApi } from '../../lib/mockApi';

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [config, setConfig] = useState({ requireVerification: true });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setBookings(mockApi.getBookings());
    setConfig(mockApi.getSettings());
  };

  const handleVerify = (id: string) => {
    mockApi.updateBookingStatus(id, BookingStatus.COMPLETED);
    refreshData();
  };

  const toggleVerification = () => {
    const newConfig = { requireVerification: !config.requireVerification };
    mockApi.updateSettings(newConfig);
    setConfig(newConfig);
  };

  const awaitingVerification = bookings.filter(b => b.status === BookingStatus.REPORT_UPLOADED);

  const stats = [
    { label: "Total Revenue", value: `₹${bookings.reduce((a, b) => a + (b.totalAmount || 0), 0)}`, icon: DollarSign, color: "bg-green-500" },
    { label: "Pending", value: bookings.filter(b => b.status === BookingStatus.PENDING).length.toString(), icon: Clock, color: "bg-amber-500" },
    { label: "Needs Verification", value: awaitingVerification.length.toString(), icon: FileText, color: "bg-red-500" },
    { label: "Patients", value: new Set(bookings.map(b => b.patientName)).size.toString(), icon: Users, color: "bg-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-72 bg-white border-r border-gray-100 flex flex-col h-auto md:h-screen sticky top-0 shadow-sm z-20">
        <div className="p-8 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center"><LayoutDashboard className="text-white w-5 h-5" /></div>
            <h2 className="text-xl font-black text-gray-900">ADMIN HUB</h2>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          {['Overview', 'Verification Queue', 'Partners', 'Settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-red-600 text-white shadow-xl shadow-red-100' 
                  : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab === 'Overview' && <LayoutDashboard className="w-5 h-5" />}
              {tab === 'Verification Queue' && <FileText className="w-5 h-5" />}
              {tab === 'Partners' && <HeartHandshake className="w-5 h-5" />}
              {tab === 'Settings' && <Settings className="w-5 h-5" />}
              {tab}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button onClick={onLogout} className="w-full flex items-center gap-3 text-gray-400 hover:text-red-600 font-bold px-5 py-4 rounded-2xl transition-all"><Home className="w-5 h-5" /> Exit Hub</button>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-16 overflow-y-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <span className="text-xs font-black text-red-600 uppercase tracking-widest">Global Diagnostics Control</span>
            <h1 className="text-4xl font-black text-gray-900 mt-1">{activeTab}</h1>
          </div>
        </header>

        {activeTab === 'Overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map(s => (
                <div key={s.label} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group">
                  <div className={`w-14 h-14 ${s.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}><s.icon className="w-7 h-7" /></div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-8">Recent Lab Activity</h3>
              <div className="space-y-4">
                {bookings.slice(-5).reverse().map(b => (
                  <div key={b.id} className="flex items-center justify-between p-6 border border-gray-50 rounded-[2rem] hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center font-bold">{b.patientName[0]}</div>
                      <div>
                        <p className="font-bold">{b.patientName}</p>
                        <p className="text-xs text-gray-400">{b.tests.length} Tests • {b.id}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      b.status === BookingStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}>{b.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Verification Queue' && (
          <div className="space-y-6">
            {awaitingVerification.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-gray-300">All Reports Verified</h3>
                <p className="text-gray-400 font-medium">No reports are pending manual verification.</p>
              </div>
            ) : (
              awaitingVerification.map(b => (
                <div key={b.id} className="bg-white p-8 rounded-[2.5rem] border border-red-100 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex-1">
                    <h4 className="text-xl font-bold">{b.patientName}</h4>
                    <p className="text-sm text-gray-500 font-medium">Uploaded by: Partner Gamma • Awaiting Final MD Sign-off</p>
                  </div>
                  <button 
                    onClick={() => handleVerify(b.id)}
                    className="bg-green-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-green-700 transition-all shadow-xl shadow-green-100"
                  >
                    Verify & Release Report
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="max-w-2xl bg-white p-12 rounded-[3rem] shadow-sm border border-gray-100">
            <h3 className="text-2xl font-black mb-10">System Configuration</h3>
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-gray-900">Partner Report Verification</p>
                <p className="text-sm text-gray-500">Require Admin approval before report becomes public.</p>
              </div>
              <button 
                onClick={toggleVerification}
                className={`w-16 h-8 rounded-full relative transition-all ${config.requireVerification ? 'bg-red-600' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${config.requireVerification ? 'left-9' : 'left-1'}`} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
