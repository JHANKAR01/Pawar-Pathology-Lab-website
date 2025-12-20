
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, User, FlaskConical, FileText, Plus, DollarSign, Clock, AlertCircle, LogOut, Home, ArrowLeft } from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { mockApi } from '../../lib/mockApi';

const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    // Refresh bookings from local storage
    const data = mockApi.getBookings();
    setBookings(data);
  }, []);

  const stats = [
    { label: "Total Revenue", value: `₹${bookings.reduce((a, b) => a + (b.totalAmount || 0), 0)}`, icon: DollarSign, color: "bg-green-500" },
    { label: "Pending", value: bookings.filter(b => b.status === BookingStatus.PENDING).length.toString(), icon: Clock, color: "bg-amber-500" },
    { label: "Samples", value: bookings.filter(b => b.status === BookingStatus.SAMPLE_COLLECTED).length.toString(), icon: FlaskConical, color: "bg-blue-500" },
    { label: "Patients", value: new Set(bookings.map(b => b.patientName)).size.toString(), icon: Users, color: "bg-red-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-72 bg-white border-r border-gray-100 flex flex-col h-auto md:h-screen sticky top-0 shadow-sm z-20">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center md:block">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">ADMIN HUB</h2>
          </div>
          <button onClick={onLogout} className="md:hidden p-2 text-gray-400"><ArrowLeft /></button>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-x-auto md:overflow-y-auto no-scrollbar flex md:block">
          {['Overview', 'Test Manager', 'Bookings', 'Staff'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 md:w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-red-600 text-white shadow-xl shadow-red-100 translate-x-1' 
                  : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab === 'Overview' && <LayoutDashboard className="w-5 h-5" />}
              {tab === 'Test Manager' && <FlaskConical className="w-5 h-5" />}
              {tab === 'Bookings' && <FileText className="w-5 h-5" />}
              {tab === 'Staff' && <Users className="w-5 h-5" />}
              {tab}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50 mt-auto bg-gray-50/50">
          <button 
            onClick={onLogout} 
            className="w-full flex items-center gap-3 text-gray-400 hover:text-red-600 font-bold px-5 py-4 rounded-2xl hover:bg-red-50 transition-all group"
          >
            <Home className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
            Back to Home
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-16 overflow-y-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-black text-red-600 uppercase tracking-widest">Diagnostic Panel</span>
            <h1 className="text-4xl font-black text-gray-900 mt-1">{activeTab}</h1>
          </div>
          <div className="flex gap-3">
             <button className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
               <FileText className="w-4 h-4" /> Export Report
             </button>
             <button className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-red-100 hover:bg-red-700 transition-colors flex items-center gap-2">
               <Plus className="w-4 h-4" /> New Entry
             </button>
          </div>
        </header>

        {activeTab === 'Overview' && (
          <div className="space-y-12">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map(s => (
                <div key={s.label} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 group hover:border-red-100 transition-colors">
                  <div className={`w-14 h-14 ${s.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-current/20 group-hover:scale-110 transition-transform`}>
                    <s.icon className="w-7 h-7" />
                  </div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Bookings Table/List */}
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black text-gray-900">Recent Bookings</h3>
                <button className="text-sm font-bold text-red-600 hover:underline">View All Records</button>
              </div>
              
              <div className="space-y-4">
                {bookings.length === 0 ? (
                  <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold">No active bookings detected in the system.</p>
                  </div>
                ) : (
                  bookings.slice(-8).reverse().map(b => (
                    <div key={b.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-gray-50 rounded-[2rem] hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-5 mb-4 md:mb-0">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                          {b.patientName?.[0] || 'P'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg leading-tight">{b.patientName}</p>
                          <p className="text-xs text-gray-400 font-medium mt-1">{b.tests.length} Specialized Tests • {b.collectionType.replace('_', ' ')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                           <p className="text-sm font-black text-gray-900">₹{b.totalAmount}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Paid Online</p>
                        </div>
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          b.status === BookingStatus.PENDING ? 'bg-amber-100 text-amber-600' : 
                          b.status === BookingStatus.REPORT_UPLOADED ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {b.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'Overview' && (activeTab === 'Staff' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {['Rahul Verma', 'Anita Singh', 'Sanjay Kumar'].map(name => (
                <div key={name} className="bg-white p-8 rounded-[2rem] border border-gray-100 flex items-center gap-6">
                   <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400"><User /></div>
                   <div>
                      <h4 className="font-bold text-lg">{name}</h4>
                      <p className="text-sm text-gray-500">Laboratory Technician</p>
                      <div className="mt-3 flex gap-2">
                         <span className="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-600 rounded">Online</span>
                         <span className="text-[10px] font-bold px-2 py-1 bg-gray-50 text-gray-400 rounded">4/8 Tasks Done</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        ) : (
          <div className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
            <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-300">Section Under Optimization</h3>
            <p className="text-gray-400 max-w-sm mx-auto mt-4 font-medium">The {activeTab} dashboard is currently being synchronized with our real-time laboratory cloud.</p>
          </div>
        ))}
      </main>
    </div>
  );
};

export default AdminDashboard;
