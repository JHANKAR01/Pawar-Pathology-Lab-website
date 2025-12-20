
import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle, Upload, MapPin, Phone, User, LogOut, Package } from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { mockApi } from '../../lib/mockApi';

const WorkerDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [tasks, setTasks] = useState<Booking[]>([]);

  useEffect(() => {
    setTasks(mockApi.getBookings());
  }, []);

  const handleUpdateStatus = (id: string, currentStatus: BookingStatus) => {
    let nextStatus = currentStatus;
    if (currentStatus === BookingStatus.PENDING) {
      nextStatus = BookingStatus.SAMPLE_COLLECTED;
    } else if (currentStatus === BookingStatus.SAMPLE_COLLECTED) {
      nextStatus = BookingStatus.REPORT_UPLOADED;
    }
    mockApi.updateBookingStatus(id, nextStatus);
    setTasks(mockApi.getBookings());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Package className="text-red-600" />
          <h1 className="font-bold text-lg">Staff Portal | Betul</h1>
        </div>
        <button onClick={onLogout} className="text-gray-500 hover:text-red-600 flex items-center gap-2 font-bold text-sm">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </nav>

      <main className="p-6 max-w-4xl mx-auto w-full">
        <header className="mb-8">
          <h2 className="text-2xl font-black text-gray-900">Assigned Collections</h2>
          <p className="text-gray-500 font-medium">Daily task list for lab staff</p>
        </header>

        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">No tasks assigned yet.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        task.status === BookingStatus.REPORT_UPLOADED ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <User className="text-gray-400 w-5 h-5" /> {task.patientName}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2"><MapPin className="text-red-500 w-4 h-4" /> Tikari, Betul (Home)</p>
                      <p className="flex items-center gap-2"><Phone className="text-green-500 w-4 h-4" /> 9755553339</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center min-w-[180px]">
                    {task.status !== BookingStatus.REPORT_UPLOADED ? (
                      <button 
                        onClick={() => handleUpdateStatus(task.id, task.status)}
                        className="w-full py-3 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all"
                      >
                        {task.status === BookingStatus.PENDING ? (
                          <><CheckCircle className="w-5 h-5" /> Collected</>
                        ) : (
                          <><Upload className="w-5 h-5" /> Upload Report</>
                        )}
                      </button>
                    ) : (
                      <div className="text-green-600 font-bold text-center bg-green-50 p-3 rounded-2xl flex items-center justify-center gap-2">
                        <CheckCircle /> Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkerDashboard;
