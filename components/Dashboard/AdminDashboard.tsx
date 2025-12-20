
import React, { useState } from 'react';
import { LayoutDashboard, Users, FlaskConical, FileText, Plus, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { Booking, BookingStatus } from '../../types';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');

  // Mock Stats
  const stats = [
    { label: "Today's Revenue", value: "₹24,500", icon: DollarSign, color: "bg-green-500" },
    { label: "Pending Collections", value: "12", icon: Clock, color: "bg-amber-500" },
    { label: "Active Bookings", value: "48", icon: FlaskConical, color: "bg-red-500" },
    { label: "New Patients", value: "156", icon: Users, color: "bg-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-red-600">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {['Overview', 'Test Manager', 'Bookings', 'Staff Management', 'Settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {tab === 'Overview' && <LayoutDashboard className="w-5 h-5" />}
              {tab === 'Test Manager' && <FlaskConical className="w-5 h-5" />}
              {tab === 'Bookings' && <FileText className="w-5 h-5" />}
              {tab === 'Staff Management' && <Users className="w-5 h-5" />}
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{activeTab}</h1>
            <p className="text-gray-500">Welcome back, Mr. Pawar</p>
          </div>
          <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-700">
            <Plus className="w-5 h-5" /> Add New Test
          </button>
        </header>

        {activeTab === 'Overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {stats.map(s => (
                <div key={s.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className={`w-12 h-12 ${s.color} text-white rounded-xl flex items-center justify-center mb-4`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6">Recent Bookings</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold">JS</div>
                        <div>
                          <p className="font-bold">John Sharma</p>
                          <p className="text-xs text-gray-500">CBC, Thyroid • Home Collection</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase">Pending</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6">Staff Availability</h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 border rounded-xl bg-green-50 border-green-200">
                      <div className="flex items-center gap-3">
                        <Users className="text-green-600" />
                        <span className="font-bold">Suresh Patel</span>
                      </div>
                      <span className="text-green-600 text-xs font-bold">ON DUTY</span>
                   </div>
                   <div className="flex items-center justify-between p-4 border rounded-xl bg-red-50 border-red-200">
                      <div className="flex items-center gap-3">
                        <Users className="text-red-600" />
                        <span className="font-bold">Amit Deshmukh</span>
                      </div>
                      <span className="text-red-600 text-xs font-bold">OFF DUTY</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'Overview' && (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-300 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400">Content for {activeTab} goes here.</h3>
            <p className="text-gray-400">Section currently under development for full production deployment.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
