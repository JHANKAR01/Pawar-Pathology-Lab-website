'use client';

// Force dynamic rendering to ensure admin sees latest data
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import {
  ShieldCheck, LogOut, RefreshCw, Trash2, UserCheck, Settings2, Home, Loader2, Calendar, FileText, X, CheckCircle, XCircle, Ticket, MapPin, BellRing,
  LayoutDashboard, HeartHandshake, Settings as SettingsIcon, Clock, CheckCircle2
} from 'lucide-react';
import { FlaskConical } from 'lucide-react';
import { BookingStatus, ISettings } from '@/types';

interface BookingType {
  _id: string;
  patientName: string;
  totalAmount: number;
  balanceAmount: number;
  referredBy: string;
  status: string;
  tests: { title: string; category: string }[];
  assignedPartnerName?: string;
  reportFileUrl?: string;
  reportStatus?: string;
  pathologistNotes?: string;
  distanceFromLab?: number;
  couponCode?: string;
  collectionType?: string;
  createdAt?: string;
}

interface Partner {
  _id: string;
  name: string;
  operationalRole: string;
  telegramChatId?: string;
  phone?: string;
}

interface BlackoutDateType {
  _id: string;
  reason: string;
  startDate: string;
  endDate: string;
  endDate: string;
}

const PaginationControls = ({ currentPage, totalPages, onPageChange, limit, onLimitChange, totalItems }: any) => (
  <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rows per page:</span>
      <select
        value={limit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        className="bg-white border-2 border-slate-200 rounded-lg px-3 py-1 text-sm font-bold text-slate-700 outline-none focus:border-clinical-rose transition-colors"
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
      <span className="text-xs text-slate-400 font-bold ml-2 uppercase tracking-wider">Total: {totalItems}</span>
    </div>
    <div className="flex items-center gap-3">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Previous
      </button>
      <span className="text-sm font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-100">
        {currentPage} / {totalPages || 1}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Next
      </button>
    </div>
  </div>
);

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Intelligence');
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartner, setNewPartner] = useState({ name: '', email: '', username: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<Partial<ISettings>>({
    appControl: { requireVerification: true, maintenanceMode: false, maintenanceModeUser: false, maintenanceModePartner: false, blockSundays: true, recurringBookingsEnabled: false },
    logistics: { serviceRadius: 10, locationFencingEnabled: false, distanceType: 'displacement' },
    notifications: { smsEnabled: true, emailEnabled: true, whatsappEnabled: true, whatsappOfficialEnabled: false, telegramEnabled: false, telegramAdminChatId: '', toggles: { admin: false, partner: false, user: false } },
    drive: { autoProvisionEnabled: false }
  });

  // Pagination State
  const [currentBookingPage, setCurrentBookingPage] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(20);
  const [totalBookings, setTotalBookings] = useState(0);

  const [currentPartnerPage, setCurrentPartnerPage] = useState(1);
  const [partnersPerPage, setPartnersPerPage] = useState(10);
  const [totalPartners, setTotalPartners] = useState(0);
  const [specimenModal, setSpecimenModal] = useState({ isOpen: false, bookingId: '', patientName: '' });
  const [isVerified, setIsVerified] = useState(false);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDateType[]>([]);
  const [newBlackout, setNewBlackout] = useState({ reason: '', startDate: '', endDate: '' });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<BookingType | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isProcessingReview, setIsProcessingReview] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountType: 'percentage' as 'percentage' | 'fixed', value: 0, expiryDate: '', usageLimit: '' });

  // Phase 4: Drive Provisioning
  const [provisioningStatus, setProvisioningStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [nextMonthAlert, setNextMonthAlert] = useState(false);
  const [provisionResult, setProvisionResult] = useState('');

  const { data: session, status } = useSession();
  const isMaster = session?.user?.role?.toLowerCase() === 'master';

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const role = session?.user?.role?.toLowerCase();
    if (status === 'authenticated') {
      if (role !== 'admin' && role !== 'master') {
        router.push('/login');
        return;
      }
      setIsVerified(true);
      fetchSettings();
      fetchBlackoutDates();
      fetchCoupons();
      checkNextMonthProvisioning(); // New Check
    }
  }, [session, status, router]);

  // Pagination Effects
  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [currentBookingPage, bookingsPerPage, status]);

  useEffect(() => {
    if (status === 'authenticated') fetchPartners();
  }, [currentPartnerPage, partnersPerPage, status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?page=${currentBookingPage}&limit=${bookingsPerPage}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        setTotalBookings(data.metadata?.totalCount || 0);
      }
      else if (res.status === 401 || res.status === 403) router.push('/login');
    } catch (error) {
      console.error('Failed to load admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch(`/api/users?role=partner&page=${currentPartnerPage}&limit=${partnersPerPage}`);
      if (res.ok) {
        const data = await res.json();
        setPartners(data.users || []);
        setTotalPartners(data.pagination?.totalDocs || 0);
      }
      else if (res.status === 401 || res.status === 403) router.push('/login');
    } catch (error) {
      console.error('Failed to load partners', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        // Fallback for flat structure if API returns old data
        const mergedConfig = {
          appControl: data.appControl || {
            requireVerification: data.requireVerification,
            maintenanceMode: data.maintenanceMode,
            maintenanceModeUser: data.maintenanceModeUser,
            maintenanceModePartner: data.maintenanceModePartner,
            blockSundays: data.blockSundays,
            recurringBookingsEnabled: false // default
          },
          logistics: data.logistics || {
            serviceRadius: data.serviceRadius,
            locationFencingEnabled: data.locationFencingEnabled,
            distanceType: data.distanceType || 'displacement'
          },
          notifications: data.notifications || {
            smsEnabled: data.smsEnabled,
            emailEnabled: data.emailEnabled,
            whatsappEnabled: data.whatsappEnabled,
            whatsappOfficialEnabled: data.whatsappOfficialEnabled,
            telegramEnabled: data.telegramEnabled,
            telegramAdminChatId: data.telegramAdminChatId,
            toggles: data.toggles || { admin: false, partner: false, user: false }
          },
          drive: data.drive || {
            lastProvisionedDate: data.lastProvisionedDate,
            autoProvisionEnabled: data.autoProvisionEnabled
          }
        };
        setConfig(mergedConfig as ISettings);
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  };

  const updateConfig = async (section: keyof ISettings, updates: Partial<any>) => {
    const newConfig = { ...config, [section]: { ...config[section], ...updates } };
    setConfig(newConfig); // Optimistic update

    // For API compatibility, we might need to send a nested structure or flat, depending on API.
    // Assuming API is updated to handle nested or we send the whole object.
    // Let's send the specific section update nested.
    const apiBody = { [section]: { ...config[section], ...updates } };

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      toast.success('Settings updated');
    } catch (error) {
      console.error('Failed to update settings', error);
      toast.error('Failed to update settings');
      fetchSettings(); // Revert on error
    }
  };

  const fetchBlackoutDates = async () => {
    try {
      const res = await fetch('/api/settings/blackout-dates');
      if (res.ok) {
        setBlackoutDates(await res.json());
      }
    } catch (error) {
      console.error('Failed to load blackout dates', error);
    }
  };

  const handleAddBlackout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/blackout-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBlackout),
      });
      if (res.ok) {
        setNewBlackout({ reason: '', startDate: '', endDate: '' });
        fetchBlackoutDates();
      } else {
        alert('Failed to add blackout date.');
      }
    } catch (err) {
      alert('An error occurred while adding blackout date.');
    }
  };

  const handleDeleteBlackout = async (id: string) => {
    if (!confirm('Are you sure you want to remove this blackout period?')) return;
    try {
      const res = await fetch(`/api/settings/blackout-dates?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchBlackoutDates();
      } else {
        alert('Failed to delete blackout date.');
      }
    } catch (err) {
      alert('An error occurred while deleting blackout date.');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string, extraData: object = {}) => {
    const originalBookings = bookings;
    setBookings(prev => prev.map(booking =>
      booking._id === id ? { ...booking, status: newStatus, ...extraData } : booking
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
      // Refetch all data to ensure consistency
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update status. Reverting changes.');
      setBookings(originalBookings);
    }
  };

  const handleOpenReview = (booking: BookingType) => {
    setSelectedBookingForReview(booking);
    setRejectNotes('');
    setReviewModalOpen(true);
  };

  const handleReleaseReport = async () => {
    if (!selectedBookingForReview) return;
    setIsProcessingReview(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBookingForReview._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          reportStatus: 'released'
        })
      });
      if (!res.ok) throw new Error('Failed to release report');
      setReviewModalOpen(false);
      setSelectedBookingForReview(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to release report');
    } finally {
      setIsProcessingReview(false);
    }
  };

  // Partner Re-assignment Logic
  const [partnerReassignModal, setPartnerReassignModal] = useState<{
    isOpen: boolean;
    bookingId: string;
    newPartnerId: string;
    currentPartnerName: string;
    newPartnerName: string;
  }>({ isOpen: false, bookingId: '', newPartnerId: '', currentPartnerName: '', newPartnerName: '' });

  const handleOpenPartnerReassign = (booking: BookingType, newPartnerId: string) => {
    const newPartner = partners.find(p => p._id === newPartnerId);
    setPartnerReassignModal({
      isOpen: true,
      bookingId: booking._id,
      newPartnerId,
      currentPartnerName: booking.assignedPartnerName || 'Unassigned',
      newPartnerName: newPartner?.name || 'Unknown'
    });
  };

  const handleConfirmPartnerReassign = async () => {
    const { bookingId, newPartnerId } = partnerReassignModal;

    // Find partner name for optmistic update
    const newPartner = partners.find(p => p._id === newPartnerId);

    // Optimistic Update
    const originalBookings = [...bookings];
    setBookings(prev => prev.map(booking =>
      booking._id === bookingId ? { ...booking, status: 'assigned', assignedPartnerName: newPartner?.name } : booking
    ));

    setPartnerReassignModal(prev => ({ ...prev, isOpen: false })); // Close immediately

    try {
      await handleUpdateStatus(bookingId, 'assigned', { assignedPartnerId: newPartnerId, assignedPartnerName: newPartner?.name });
      toast.success('Partner re-assigned successfully');
    } catch (error) {
      setBookings(originalBookings); // Revert
      toast.error('Failed to re-assign partner');
    }
  };

  // Coupon Usage Logic
  const [couponUsageModal, setCouponUsageModal] = useState<{
    isOpen: boolean;
    couponCode: string;
    matches: BookingType[];
  }>({ isOpen: false, couponCode: '', matches: [] });

  const handleCheckUsage = (code: string) => {
    // Client-side filtering for now as per plan
    const matches = bookings.filter(b => b.couponCode === code);
    setCouponUsageModal({
      isOpen: true,
      couponCode: code,
      matches
    });
  };

  const handleRejectReport = async () => {
    if (!selectedBookingForReview || !rejectNotes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }
    setIsProcessingReview(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBookingForReview._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'sample_collected',
          reportStatus: 'rejected',
          pathologistNotes: rejectNotes
        })
      });
      if (!res.ok) throw new Error('Failed to reject report');
      setReviewModalOpen(false);
      setSelectedBookingForReview(null);
      setRejectNotes('');
      fetchData();
      toast.success('Report rejected successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject report');
    } finally {
      setIsProcessingReview(false);
    }
  };

  // Rejection Workflow Logic
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedBookingForRejection, setSelectedBookingForRejection] = useState<BookingType | null>(null);

  const handleOpenRejection = (booking: BookingType) => {
    setSelectedBookingForRejection(booking);
    setRejectNotes('');
    setRejectionModalOpen(true);
  };

  const handleConfirmRejection = async () => {
    if (!selectedBookingForRejection || !rejectNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    // Optimistic Update
    const originalBookings = [...bookings];
    setBookings(prev => prev.map(b => b._id === selectedBookingForRejection._id ? { ...b, status: 'rejected' } : b));

    setIsProcessingReview(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBookingForRejection._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          pathologistNotes: rejectNotes
        })
      });

      if (!res.ok) throw new Error('Failed to reject booking');

      setRejectionModalOpen(false);
      setSelectedBookingForRejection(null);
      setRejectNotes('');
      toast.success('Booking rejected and user notified');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject booking');
      setBookings(originalBookings); // Revert
    } finally {
      setIsProcessingReview(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error('Failed to fetch coupons', error);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: newCoupon.code.toUpperCase().trim(),
          discountType: newCoupon.discountType,
          value: newCoupon.value,
          expiryDate: newCoupon.expiryDate,
          usageLimit: newCoupon.usageLimit ? parseInt(newCoupon.usageLimit) : undefined
        })
      });
      if (res.ok) {
        setNewCoupon({ code: '', discountType: 'percentage', value: 0, expiryDate: '', usageLimit: '' });
        fetchCoupons();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create coupon');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchCoupons();
      } else {
        alert('Failed to delete coupon');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete coupon');
    }
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...newPartner, role: 'partner', operationalRole: 'helper' })
      });
      if (res.ok) {
        setNewPartner({ name: '', email: '', username: '', password: '' });
        fetchPartners();
        alert('Partner Added Successfully');
      } else {
        if (res.status === 401 || res.status === 403) router.push('/login');
        const errorData = await res.json();
        alert(`Failed to add partner: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    }
  };

  const handleMarkSpecimenCollected = async () => {
    if (!specimenModal.bookingId) return;
    try {
      await handleUpdateStatus(specimenModal.bookingId, 'sample_collected');
      toast.success('Specimen marked as collected!');
      setSpecimenModal({ isOpen: false, bookingId: '', patientName: '' });
    } catch (error) {
      toast.error('Failed to mark specimen collected.');
    }
  };

  // Dashboard Stats Logic
  const stats = [
    { label: 'Total Visits', value: bookings.length, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Pending Reports', value: bookings.filter((b: any) => b.status === BookingStatus.PENDING || b.status === BookingStatus.SAMPLE_COLLECTED).length, icon: FileText, color: 'bg-amber-500' },
    { label: 'Revenue (Today)', value: `₹${bookings.filter((b: any) => new Date(b.createdAt).toDateString() === new Date().toDateString()).reduce((acc: number, curr: any) => acc + (curr.totalAmount || 0), 0)}`, icon: HeartHandshake, color: 'bg-emerald-500' },
  ];

  const handleLogout = async () => {
    // Phase 4: Secure Hard Logout
    // Clear any local storage if used
    localStorage.clear();
    sessionStorage.clear();

    // Attempt to clear cookies via document (client-side attempt)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    await signOut({ callbackUrl: '/login' });
  };

  // Phase 4: Drive Provisioning Function
  const checkNextMonthProvisioning = () => {
    const now = new Date();
    // Check if it's past the 15th
    if (now.getDate() >= 15) {
      // Logic to check if next month is provisioned would theoretically require an API call
      // to check DB presence, but for now we just show the alert proactively if late in month.
      // A more robust way is to ask the new API "is next month ready?".
      // For simplicity as per prompt "check if current date is 15th or later"
      // We will assume it might not be ready and show alert (or we could fetch check).
      // Let's just set alert true for visibility if > 15th.
      setNextMonthAlert(true);
    }
  };

  const handleProvisionFolders = async () => {
    if (!confirm("This will generate 30+ folders in Google Drive and cache IDs in the database to optimize API limits. Proceed?")) return;

    setProvisioningStatus('loading');
    try {
      const now = new Date();
      // Provision NEXT month if > 15th, else CURRENT month?
      // Prompt says "Provision Folders for [Next Month]".
      // Let's calculate next month.
      let targetYear = now.getFullYear();
      let targetMonthIdx = now.getMonth() + 1; // Next Month
      if (targetMonthIdx > 11) {
        targetMonthIdx = 0;
        targetYear++;
      }

      const nextMonthDate = new Date(targetYear, targetMonthIdx, 1);
      const monthName = nextMonthDate.toLocaleString('default', { month: 'long' });
      const daysInMonth = new Date(targetYear, targetMonthIdx + 1, 0).getDate();

      const res = await fetch('/api/admin/provision-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: targetYear, monthName, daysInMonth })
      });

      const data = await res.json();
      if (res.ok) {
        setProvisioningStatus('success');
        setProvisionResult(data.message);
        toast.success(data.message);
        setNextMonthAlert(false); // Clear alert
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setProvisioningStatus('error');
      setProvisionResult(e.message);
      toast.error("Provisioning failed: " + e.message);
    }
  };

  const handleUpdatePartnerTelegram = async (partnerId: string, chatId: string) => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: partnerId, telegramChatId: chatId })
      });
      if (res.ok) {
        toast.success("Partner Telegram ID updated");
        fetchPartners(); // refresh
      } else {
        toast.error("Failed to update ID");
      }
    } catch (e) { toast.error("Update failed"); }
  };

  const getStatusBadge = (status: string) => {
    const base = 'px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest';
    switch (status) {
      case 'pending': return `${base} bg-warning/10 text-warning border-2 border-warning/20`;
      case 'accepted': return `${base} bg-success/10 text-success border-2 border-success/20`;
      case 'assigned': return `${base} bg-blue-500/10 text-blue-600 border-2 border-blue-500/20`;
      case 'completed': return `${base} bg-slate-200 text-slate-700 border-2 border-slate-300`;
      case 'sample_collected': return `${base} bg-purple-500/10 text-purple-600 border-2 border-purple-500/20`;
      default: return `${base} bg-slate-100 text-slate-600 border-2 border-slate-200`;
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
        </div>
        <Skeleton className="h-[500px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'master')) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans p-4 lg:p-8 gap-8 bg-slate-50">
      <aside className="w-full lg:w-80 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] bg-white rounded-3xl p-8 flex flex-col relative z-20 shadow-large border border-slate-200">
        <div className="flex items-center gap-4 mb-10 border-b-2 border-slate-200 pb-10">
          <div className="w-14 h-14 bg-clinical-rose rounded-2xl flex items-center justify-center shadow-rose">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">ADMIN<span className="text-clinical-rose">OS</span></h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">V3.5 Clinical</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'Intelligence', icon: LayoutDashboard, label: 'Intelligence' },
            { id: 'Bookings', icon: Clock, label: 'Bookings' },
            { id: 'Partners', icon: HeartHandshake, label: 'Partners' },
            { id: 'Config', icon: Settings2, label: 'Config' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-bold ${activeTab === item.id ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-clinical-rose' : ''} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 pt-6 border-t-2 border-slate-200">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all text-slate-600 hover:text-clinical-rose hover:bg-clinical-rose-light">
            <Home className="w-5 h-5" /> Homepage
          </button>
          <button onClick={handleLogout} className="w-full mt-2 flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all text-slate-600 hover:text-clinical-rose hover:bg-clinical-rose-light">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
        <div className="bg-white rounded-3xl p-8 shadow-large border border-slate-200 space-y-8">
          <header className="flex justify-between items-center">
            <div>
              <span className="text-xs font-black text-clinical-rose uppercase tracking-wider mb-3 block">Node System Monitor</span>
              <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">{activeTab}</h1>
            </div>
            <button onClick={fetchData} className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:bg-clinical-rose-light transition-all shadow-medium border-2 border-slate-200 hover:border-clinical-rose">
              <RefreshCw className={`text-clinical-rose w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'Intelligence' && (
              <motion.div
                key="Intelligence"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                <motion.div
                  className="card-premium p-10"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-4">Total Revenue</p>
                  <p className="text-5xl font-black text-slate-900">₹{bookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0)}</p>
                </motion.div>
                <motion.div
                  className="card-premium p-10"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-warning text-xs font-black uppercase tracking-widest mb-4">Pending Approval</p>
                  <p className="text-5xl font-black text-slate-900">{bookings.filter(b => b.status === 'pending').length}</p>
                </motion.div>
                <motion.div
                  className="card-premium p-10"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-success text-xs font-black uppercase tracking-widest mb-4">Completed Cycles</p>
                  <p className="text-5xl font-black text-slate-900">{bookings.filter(b => b.status === 'completed').length}</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'Bookings' && (
              <motion.div
                key="Bookings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {bookings.filter(b => b.status !== 'completed').length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-400">
                    <FlaskConical size={48} className="mb-4 opacity-50" />
                    <p className="font-bold">No active bookings to manage</p>
                  </div>
                ) : (
                  bookings.filter(b => b.status !== 'completed').map((b, index) => (
                    <motion.div
                      key={b._id}
                      className="card-premium p-6 flex flex-col gap-4 border-2 border-slate-100 hover:border-slate-300 transition-all"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-black text-slate-900 line-clamp-1">{b.patientName}</h4>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">{b.collectionType || 'Lab Visit'}</p>
                        </div>
                        <span className={getStatusBadge(b.status)}>{b.status}</span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Tests Requested</p>
                        <div className="flex flex-wrap gap-2">
                          {b.tests.map((t, idx) => (
                            <span key={idx} className="bg-white px-2 py-1 rounded-md border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                              {t.title}
                            </span>
                          ))}
                        </div>
                      </div>

                      {b.distanceFromLab && (
                        <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl border border-blue-100">
                          <MapPin size={18} />
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest">Logistics Distance</p>
                            <p className="font-bold">{b.distanceFromLab.toFixed(1)} KM via Road</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4 text-slate-900 border-t border-slate-100 pt-4 mt-auto">
                        <div className="flex-1">
                          <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Total</p>
                          <p className="font-bold text-lg">₹{b.totalAmount}</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Balance</p>
                          <p className="font-bold text-lg text-clinical-rose">₹{b.balanceAmount}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 mt-2">
                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(b._id, 'accepted')}
                              className="flex-1 bg-success/10 text-success px-4 py-3 rounded-xl font-bold text-xs hover:bg-success/20 transition-all border-2 border-success/20 flex items-center justify-center gap-2"
                            >
                              <CheckCircle size={16} /> Approve
                            </button>
                            <button
                              onClick={() => handleOpenRejection(b)}
                              className="flex-1 bg-clinical-rose/10 text-clinical-rose px-4 py-3 rounded-xl font-bold text-xs hover:bg-clinical-rose/20 transition-all border-2 border-clinical-rose/20 flex items-center justify-center gap-2"
                            >
                              <XCircle size={16} /> Reject
                            </button>
                          </>
                        )}
                        {b.status === 'report_uploaded' && b.reportFileUrl && (
                          <button
                            onClick={() => handleOpenReview(b)}
                            className="w-full bg-clinical-rose/10 text-clinical-rose px-4 py-3 rounded-xl font-bold text-xs hover:bg-clinical-rose/20 transition-all border-2 border-clinical-rose/20 flex items-center justify-center gap-2"
                          >
                            <FileText size={16} /> Review Report
                          </button>
                        )}
                        {/* Fallback for other statuses if needed, or leave empty */}
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'Reports' && (
              <motion.div
                key="Reports"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-12"
              >
                {/* Bucket 1: Payment Done + Approve */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <CheckCircle className="text-success" /> Ready for Release (Paid)
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs">{bookings.filter(b => b.status === 'report_uploaded' && b.balanceAmount === 0).length}</span>
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {bookings.filter(b => b.status === 'report_uploaded' && b.balanceAmount === 0).map(b => (
                      <div key={b._id} className="card-premium p-6 border-l-4 border-success">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-lg">{b.patientName}</h4>
                            <p className="text-xs text-slate-500 font-bold uppercase">{b.tests.map(t => t.title).join(', ')}</p>
                          </div>
                          <span className="bg-success text-white px-3 py-1 rounded-full text-xs font-black uppercase">Paid</span>
                        </div>
                        <button
                          onClick={() => handleOpenReview(b)}
                          className="w-full bg-success text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-success/90 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <FileText size={16} /> Review & Approve
                        </button>
                      </div>
                    ))}
                    {bookings.filter(b => b.status === 'report_uploaded' && b.balanceAmount === 0).length === 0 && <p className="text-slate-400 text-sm font-medium italic col-span-full">No pending paid reports.</p>}
                  </div>
                </div>

                {/* Bucket 2: Payment Pending + Approve */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Clock className="text-amber-500" /> Pending Payment (Action Required)
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs">{bookings.filter(b => b.status === 'report_uploaded' && b.balanceAmount > 0).length}</span>
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {bookings.filter(b => b.status === 'report_uploaded' && b.balanceAmount > 0).map(b => (
                      <div key={b._id} className="card-premium p-6 border-l-4 border-amber-500">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-lg">{b.patientName}</h4>
                            <p className="text-xs text-slate-500 font-bold uppercase">{b.tests.map(t => t.title).join(', ')}</p>
                          </div>
                          <div className="text-right">
                            <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-xs font-black uppercase block mb-1">Unpaid</span>
                            <span className="text-xs font-bold text-clinical-rose">Due: ₹{b.balanceAmount}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenReview(b)}
                          className="w-full bg-amber-500 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-amber-600 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <FileText size={16} /> Review (Will Notify Payment)
                        </button>
                      </div>
                    ))}
                    {bookings.filter(b => b.status === 'report_uploaded' && b.balanceAmount > 0).length === 0 && <p className="text-slate-400 text-sm font-medium italic col-span-full">No pending unpaid reports.</p>}
                  </div>
                </div>

                {/* Bucket 3: Approved/Released */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <CheckCircle2 className="text-blue-600" /> Released Reports
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs">{bookings.filter(b => b.status === 'completed' && b.reportStatus === 'released').length}</span>
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-75 hover:opacity-100 transition-opacity">
                    {bookings.filter(b => b.status === 'completed' && b.reportStatus === 'released').slice(0, 5).map(b => (
                      <div key={b._id} className="card-premium p-6 border-l-4 border-blue-600 bg-slate-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-slate-700">{b.patientName}</h4>
                            <p className="text-xs text-slate-500">Released on {new Date(b.createdAt!).toLocaleDateString()}</p>
                          </div>
                          <a href={`/api/reports/download/${b._id}`} target="_blank" className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1"><FileText size={14} /> View PDF</a>
                        </div>
                      </div>
                    ))}
                    {bookings.filter(b => b.status === 'completed' && b.reportStatus === 'released').length > 5 && <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">+ {bookings.filter(b => b.status === 'completed' && b.reportStatus === 'released').length - 5} more (view in Bookings tab)</p>}
                  </div>
                </div>

                {/* Bucket 4: Rejected */}
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <XCircle className="text-rose-600" /> Rejected / Re-upload Requested
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs">{bookings.filter(b => b.reportStatus === 'rejected').length}</span>
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {bookings.filter(b => b.reportStatus === 'rejected').map(b => (
                      <div key={b._id} className="card-premium p-6 border-l-4 border-rose-600 bg-rose-50/50">
                        <div>
                          <h4 className="font-bold text-slate-900">{b.patientName}</h4>
                          <p className="text-xs font-bold text-rose-600 mt-2 uppercase tracking-wide">Reason: {b.pathologistNotes}</p>
                          <p className="text-xs text-slate-500 mt-1">Status reverted to: {b.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'Specimens' && (
              <motion.div
                key="Specimens"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {bookings.filter(b => b.status === 'accepted' || b.status === 'assigned' || b.status === 'sample_collected').length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center p-12 text-slate-400">
                    <FlaskConical size={48} className="mb-4 opacity-50" />
                    <p className="font-bold">No active specimens to manage</p>
                  </div>
                ) : (
                  bookings.filter(b => b.status === 'accepted' || b.status === 'assigned' || b.status === 'sample_collected').map(b => (
                    <motion.div
                      key={b._id}
                      className="card-premium p-6 flex flex-col gap-4 border-2 border-slate-100 hover:border-slate-300 transition-all"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-black text-slate-900 line-clamp-1">{b.patientName}</h4>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">{b.collectionType || 'Lab Visit'}</p>
                        </div>
                        <span className={getStatusBadge(b.status)}>{b.status}</span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Tests Requested</p>
                        <div className="flex flex-wrap gap-2">
                          {b.tests.map((t, idx) => (
                            <span key={idx} className="bg-white px-2 py-1 rounded-md border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                              {t.title}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Logistics Section */}
                      {b.distanceFromLab && b.collectionType === 'home' && (
                        <div className="flex items-center gap-3 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl border border-blue-100">
                          <MapPin size={18} />
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest">Logistics Distance</p>
                            <p className="font-bold">{b.distanceFromLab.toFixed(1)} KM via Road</p>
                          </div>
                        </div>
                      )}

                      {/* Partner Assignment */}
                      <div className="mt-auto pt-4 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Assigned Partner</label>
                        <select
                          onChange={(e) => handleOpenPartnerReassign(b, e.target.value)}
                          className={`w-full bg-white border-2 rounded-xl px-4 py-3 font-bold outline-none transition-all ${b.assignedPartnerName ? 'border-clinical-rose/30 text-clinical-rose' : 'border-slate-200 text-slate-900'} focus:border-clinical-rose focus:ring-4 focus:ring-clinical-rose/10`}
                          value={partners.find(p => p.name === b.assignedPartnerName)?._id || ""}
                        >
                          <option value="" disabled>Select Logistics Partner</option>
                          {partners.map(p => (
                            <option key={p._id} value={p._id}>{p.name} ({p.operationalRole})</option>
                          ))}
                        </select>
                      </div>

                      {/* Mark Specimen Collected Button */}
                      {b.status !== 'sample_collected' && (
                        <button
                          onClick={() => setSpecimenModal({ isOpen: true, bookingId: b._id, patientName: b.patientName })}
                          className="w-full bg-purple-600 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
                        >
                          <CheckCircle size={16} /> Mark Specimen Collected
                        </button>
                      )}
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'Partners' && (
              <motion.div
                key="Partners"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <motion.div
                  className="card-premium p-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-2xl font-black text-slate-900 mb-8">Register New Partner</h3>
                  <form onSubmit={handleAddPartner} className="space-y-6">
                    <input className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400" placeholder="Full Name" value={newPartner.name} onChange={e => setNewPartner({ ...newPartner, name: e.target.value })} />
                    <input className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400" placeholder="Email" type="email" value={newPartner.email} onChange={e => setNewPartner({ ...newPartner, email: e.target.value })} />
                    <input className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400" placeholder="Username" value={newPartner.username} onChange={e => setNewPartner({ ...newPartner, username: e.target.value })} />
                    <input className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400" placeholder="Password" type="password" value={newPartner.password} onChange={e => setNewPartner({ ...newPartner, password: e.target.value })} />
                    <button type="submit" className="w-full bg-clinical-rose text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-rose-lg hover:bg-clinical-rose-dark transition-all">Register</button>
                  </form>
                </motion.div>
                <motion.div
                  className="card-premium p-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-2xl font-black text-slate-900 mb-8">Active Partners</h3>
                  <div className="space-y-4">
                    {partners.map(p => (
                      <div key={p._id} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900 text-lg">{p.name}</p>
                            <p className="text-sm text-slate-600 font-bold uppercase">{p.operationalRole}</p>
                          </div>
                        </div>

                        {/* Telegram ID Input */}
                        <div className="pt-3 border-t border-slate-200">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                            Telegram Chat ID
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter Chat ID"
                              defaultValue={p.telegramChatId || ''}
                              id={`telegram-${p._id}`}
                              className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-mono focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById(`telegram-${p._id}`) as HTMLInputElement;
                                if (input) handleUpdatePartnerTelegram(p._id, input.value);
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all"
                            >
                              Save
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Open <a href="https://t.me/PawarPathLabBot" target="_blank" className="text-blue-500 hover:underline">@PawarPathLabBot</a> & type /id
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'Coupons' && (
              <motion.div
                key="Coupons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <motion.div
                  className="card-premium p-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-2xl font-black text-slate-900 mb-8">Create New Coupon</h3>
                  <form onSubmit={handleAddCoupon} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Coupon Code</label>
                      <input
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400 uppercase"
                        placeholder="SAVE10"
                        value={newCoupon.code}
                        onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Discount Type</label>
                      <select
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all"
                        value={newCoupon.discountType}
                        onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value as 'percentage' | 'fixed' })}
                        required
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        {newCoupon.discountType === 'percentage' ? 'Discount Percentage (0-100)' : 'Discount Amount (₹)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={newCoupon.discountType === 'percentage' ? 100 : undefined}
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400"
                        placeholder={newCoupon.discountType === 'percentage' ? '10' : '100'}
                        value={newCoupon.value || ''}
                        onChange={e => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Expiry Date</label>
                      <input
                        type="date"
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all"
                        value={newCoupon.expiryDate}
                        onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Usage Limit (Optional)</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400"
                        placeholder="Leave empty for unlimited"
                        value={newCoupon.usageLimit}
                        onChange={e => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="w-full bg-clinical-rose text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-rose-lg hover:bg-clinical-rose-dark transition-all">Create Coupon</button>
                  </form>
                </motion.div>
                <motion.div
                  className="card-premium p-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-2xl font-black text-slate-900 mb-8">Active Coupons</h3>
                  <div className="space-y-4">
                    {coupons.length > 0 ? (
                      coupons.map(coupon => (
                        <div key={coupon._id} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border-2 border-slate-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-black text-lg text-slate-900">{coupon.code}</p>
                              {new Date(coupon.expiryDate) < new Date() && (
                                <span className="text-xs font-bold text-clinical-rose uppercase">Expired</span>
                              )}
                              {!coupon.isActive && (
                                <span className="text-xs font-bold text-slate-500 uppercase">Inactive</span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 font-bold">
                              {coupon.discountType === 'percentage'
                                ? `${coupon.value}% off`
                                : `₹${coupon.value} off`}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                              {coupon.usageLimit && ` • Used: ${coupon.usedCount}/${coupon.usageLimit}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleCheckUsage(coupon.code)}
                              className="p-2 hover:bg-clinical-rose-light rounded-lg transition-colors"
                              title="Check Usage"
                            >
                              <UserCheck className="text-slate-500 hover:text-clinical-rose" size={20} />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(coupon._id)}
                              className="p-2 hover:bg-clinical-rose-light rounded-lg transition-colors"
                              title="Delete Coupon"
                            >
                              <Trash2 className="text-slate-500 hover:text-clinical-rose" size={20} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p>No coupons created yet</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === 'Config' && (
              <motion.div
                key="Config"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                      <Settings2 className="text-clinical-rose" />
                      System Configuration v3.5
                    </h3>

                    <div className="space-y-8">
                      {/* Gated Section: Only Master Admins can see Infrastructure & Logistics */}
                      {isMaster ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Infrastructure - Drive Provisioning */}
                          <div className={`p-6 rounded-2xl border ${nextMonthAlert ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-xl ${nextMonthAlert ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                <SettingsIcon size={24} />
                              </div>
                              <div>
                                <h4 className={`font-bold ${nextMonthAlert ? 'text-red-700' : 'text-slate-900'}`}>Drive Infrastructure</h4>
                                <p className={`text-xs mt-1 ${nextMonthAlert ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                  {nextMonthAlert ? 'Action Required: Provision folders for next month!' : 'Optimize API usage with cached folders.'}
                                </p>

                                <button
                                  onClick={handleProvisionFolders}
                                  disabled={provisioningStatus === 'loading'}
                                  className={`mt-4 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${nextMonthAlert ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                  {provisioningStatus === 'loading' ? <Loader2 className="animate-spin" /> : 'Provision Next Month'}
                                </button>
                                {provisioningStatus === 'success' && <p className="text-xs text-green-600 font-bold mt-2">Provisioned successfully!</p>}
                              </div>
                            </div>
                          </div>

                          {/* Logistics - Geo Fencing */}
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h4 className="font-bold text-slate-900">Geo Fencing</h4>
                                <p className="text-xs text-slate-500 mt-1">Restrict booking area ({config.logistics?.serviceRadius || 10}km)</p>
                              </div>
                              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                <input
                                  type="checkbox"
                                  id="fencing-toggle"
                                  className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                  checked={(config as any).locationFencingEnabled ?? false}
                                  onChange={(e) => updateConfig('logistics', { locationFencingEnabled: e.target.checked })}
                                />
                                <label
                                  htmlFor="fencing-toggle"
                                  className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${(config as any).locationFencingEnabled ? 'bg-clinical-rose' : 'bg-slate-300'}`}
                                ></label>
                                <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${(config as any).locationFencingEnabled ? 'translate-x-6' : '0'}`}></div>
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mb-4">Restrict bookings to a specific radius from the lab.</p>

                            <div className="flex items-center gap-3">
                              <MapPin size={20} className="text-slate-400" />
                              <span className="text-sm font-bold text-slate-700">Service Radius (KM)</span>
                              <input
                                type="number"
                                className="w-24 px-3 py-2 bg-white border-2 border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-clinical-rose"
                                value={(config as any).serviceRadius ?? 10}
                                onChange={(e) => updateConfig('logistics', { serviceRadius: Number(e.target.value) })}
                              />
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-200">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h5 className="font-bold text-slate-900 text-sm">Distance Calculation Logic</h5>
                                  <p className="text-xs text-slate-500">Choose between straight line or road network</p>
                                </div>
                                <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                                  <button
                                    onClick={() => updateConfig('logistics', { distanceType: 'displacement' })}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${(config as any).distanceType === 'displacement' || !(config as any).distanceType ? 'bg-white shadow-sm text-clinical-rose' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    Displacement
                                  </button>
                                  <button
                                    onClick={() => updateConfig('logistics', { distanceType: 'road' })}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${(config as any).distanceType === 'road' ? 'bg-white shadow-sm text-clinical-rose' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    Road (OSRM)
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-12 bg-amber-50 border-2 border-amber-200 rounded-3xl text-center">
                          <ShieldCheck className="mx-auto text-amber-500 mb-4" size={48} />
                          <h3 className="text-xl font-black text-slate-900">Restricted Access</h3>
                          <p className="text-slate-600">Infrastructure settings are restricted to Master Accounts.</p>
                        </div>
                      )}

                      <div className="h-px bg-slate-100 my-8"></div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Verification Toggle */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-slate-900">Patient Verification</h4>
                              <p className="text-xs text-slate-500 mt-1">Require verify on signup</p>
                            </div>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                              <input
                                type="checkbox"
                                id="verification-toggle"
                                className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                checked={config.appControl?.requireVerification ?? true}
                                onChange={(e) => updateConfig('appControl', { requireVerification: e.target.checked })}
                              />
                              <label
                                htmlFor="verification-toggle"
                                className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${config.appControl?.requireVerification ? 'bg-clinical-rose' : 'bg-slate-300'}`}
                              ></label>
                              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${config.appControl?.requireVerification ? 'translate-x-6' : '0'}`}></div>
                            </div>
                          </div>
                        </div>

                        {/* Block Sundays */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-slate-900">Block Sundays</h4>
                              <p className="text-xs text-slate-500 mt-1">Disable booking on Sundays</p>
                            </div>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                              <input
                                type="checkbox"
                                id="sunday-toggle"
                                className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                checked={config.appControl?.blockSundays ?? true}
                                onChange={(e) => updateConfig('appControl', { blockSundays: e.target.checked })}
                              />
                              <label
                                htmlFor="sunday-toggle"
                                className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${config.appControl?.blockSundays ? 'bg-clinical-rose' : 'bg-slate-300'}`}
                              ></label>
                              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${config.appControl?.blockSundays ? 'translate-x-6' : '0'}`}></div>
                            </div>
                          </div>
                        </div>

                        {/* Recurring Bookings */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-slate-900">Recurring Bookings</h4>
                              <p className="text-xs text-slate-500 mt-1">Allow scheduled recurrence</p>
                            </div>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                              <input
                                type="checkbox"
                                id="recurring-toggle"
                                className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                checked={config.appControl?.recurringBookingsEnabled ?? false}
                                onChange={(e) => updateConfig('appControl', { recurringBookingsEnabled: e.target.checked })}
                              />
                              <label
                                htmlFor="recurring-toggle"
                                className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${config.appControl?.recurringBookingsEnabled ? 'bg-clinical-rose' : 'bg-slate-300'}`}
                              ></label>
                              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${config.appControl?.recurringBookingsEnabled ? 'translate-x-6' : '0'}`}></div>
                            </div>
                          </div>
                        </div>

                        {/* System Maintenance */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 md:col-span-2">
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ShieldCheck size={18} /> System Maintenance</h4>
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-red-100 shadow-sm col-span-2 md:col-span-2">
                              <div><h5 className="font-bold text-xs uppercase tracking-wide text-slate-700">Global Emergency Lock</h5><p className="text-[10px] text-slate-500">Block ALL access (except Admin)</p></div>
                              <div className="relative inline-block w-10 h-5"><input type="checkbox" className="peer absolute w-full h-full opacity-0 cursor-pointer" checked={config.appControl?.maintenanceMode ?? false} onChange={(e) => updateConfig('appControl', { maintenanceMode: e.target.checked })} /><span className={`block w-full h-full rounded-full transition ${config.appControl?.maintenanceMode ? 'bg-red-600' : 'bg-slate-300'}`}></span><span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition transform ${config.appControl?.maintenanceMode ? 'translate-x-5' : ''}`}></span></div>
                            </div>
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                              <div><h5 className="font-bold text-xs uppercase tracking-wide text-slate-700">Patient Portal</h5><p className="text-[10px] text-slate-500">Block patient access</p></div>
                              <div className="relative inline-block w-10 h-5"><input type="checkbox" className="peer absolute w-full h-full opacity-0 cursor-pointer" checked={config.appControl?.maintenanceModeUser ?? false} onChange={(e) => updateConfig('appControl', { maintenanceModeUser: e.target.checked })} /><span className={`block w-full h-full rounded-full transition ${config.appControl?.maintenanceModeUser ? 'bg-rose-500' : 'bg-slate-300'}`}></span><span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition transform ${config.appControl?.maintenanceModeUser ? 'translate-x-5' : ''}`}></span></div>
                            </div>
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                              <div><h5 className="font-bold text-xs uppercase tracking-wide text-slate-700">Partner Portal</h5><p className="text-[10px] text-slate-500">Block partner access</p></div>
                              <div className="relative inline-block w-10 h-5"><input type="checkbox" className="peer absolute w-full h-full opacity-0 cursor-pointer" checked={config.appControl?.maintenanceModePartner ?? false} onChange={(e) => updateConfig('appControl', { maintenanceModePartner: e.target.checked })} /><span className={`block w-full h-full rounded-full transition ${config.appControl?.maintenanceModePartner ? 'bg-rose-500' : 'bg-slate-300'}`}></span><span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition transform ${config.appControl?.maintenanceModePartner ? 'translate-x-5' : ''}`}></span></div>
                            </div>
                          </div>
                        </div>

                        {/* Notifications */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 md:col-span-1">
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BellRing size={18} /> Basic Alerts</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-700">SMS</span>
                              <div className="relative inline-block w-10 h-5"><input type="checkbox" className="peer absolute w-full h-full opacity-0 cursor-pointer" checked={config.notifications?.smsEnabled ?? true} onChange={(e) => updateConfig('notifications', { smsEnabled: e.target.checked })} /><span className={`block w-full h-full rounded-full transition ${config.notifications?.smsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></span><span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition transform ${config.notifications?.smsEnabled ? 'translate-x-5' : ''}`}></span></div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold text-slate-700">Email</span>
                              <div className="relative inline-block w-10 h-5"><input type="checkbox" className="peer absolute w-full h-full opacity-0 cursor-pointer" checked={config.notifications?.emailEnabled ?? true} onChange={(e) => updateConfig('notifications', { emailEnabled: e.target.checked })} /><span className={`block w-full h-full rounded-full transition ${config.notifications?.emailEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></span><span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition transform ${config.notifications?.emailEnabled ? 'translate-x-5' : ''}`}></span></div>
                            </div>
                          </div>
                        </div>

                        {/* Smart Notification Hub - Advanced */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 md:col-span-2">
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BellRing size={18} /> Smart Notification Hub</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div><h5 className="font-bold text-sm text-slate-800">WhatsApp Integration</h5><p className="text-xs text-slate-500">Enable WhatsApp messaging</p></div>
                              <div className="relative inline-block w-10 h-5"><input type="checkbox" className="peer absolute w-full h-full opacity-0 cursor-pointer" checked={config.notifications?.whatsappEnabled ?? true} onChange={(e) => updateConfig('notifications', { whatsappEnabled: e.target.checked })} /><span className={`block w-full h-full rounded-full transition ${config.notifications?.whatsappEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></span><span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition transform ${config.notifications?.whatsappEnabled ? 'translate-x-5' : ''}`}></span></div>
                            </div>
                            {(config.notifications?.whatsappEnabled) && (
                              <div className="pl-4 border-l-2 border-slate-200 ml-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <input type="checkbox" id="wa-official" checked={config.notifications?.whatsappOfficialEnabled ?? false} onChange={(e) => updateConfig('notifications', { whatsappOfficialEnabled: e.target.checked })} className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500" />
                                  <label htmlFor="wa-official" className="text-xs font-bold text-slate-700">Use Official Cloud API (Costs apply)</label>
                                </div>
                                <p className="text-[10px] text-slate-500">If unchecked, system sends Email with a "Chat on WhatsApp" deep-link (Free).</p>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                              <div><h5 className="font-bold text-sm text-slate-800">Telegram Staff Alerts</h5><p className="text-xs text-slate-500">Internal alerts for new bookings</p></div>
                              <div className="relative inline-block w-10 h-5"><input type="checkbox" className="peer absolute w-full h-full opacity-0 cursor-pointer" checked={config.notifications?.telegramEnabled ?? false} onChange={(e) => updateConfig('notifications', { telegramEnabled: e.target.checked })} /><span className={`block w-full h-full rounded-full transition ${config.notifications?.telegramEnabled ? 'bg-sky-500' : 'bg-slate-300'}`}></span><span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition transform ${config.notifications?.telegramEnabled ? 'translate-x-5' : ''}`}></span></div>
                            </div>
                            {(config.notifications?.telegramEnabled) && (
                              <div className="space-y-4 pt-2">
                                <input type="text" placeholder="Admin Chat ID" value={config.notifications?.telegramAdminChatId || ''} onChange={(e) => updateConfig('notifications', { telegramAdminChatId: e.target.value })} className="w-full text-xs px-3 py-2 border rounded-lg" />

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={config.notifications?.toggles?.admin ?? false} onChange={(e) => {
                                      const currentToggles = config.notifications?.toggles || { admin: false, partner: false, user: false };
                                      updateConfig('notifications', { toggles: { ...currentToggles, admin: e.target.checked } })
                                    }} />
                                    <span>Admin Alerts</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={config.notifications?.toggles?.partner ?? false} onChange={(e) => {
                                      const currentToggles = config.notifications?.toggles || { admin: false, partner: false, user: false };
                                      updateConfig('notifications', { toggles: { ...currentToggles, partner: e.target.checked } })
                                    }} />
                                    <span>Partner Alerts</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={config.notifications?.toggles?.user ?? false} onChange={(e) => {
                                      const currentToggles = config.notifications?.toggles || { admin: false, partner: false, user: false };
                                      updateConfig('notifications', { toggles: { ...currentToggles, user: e.target.checked } })
                                    }} />
                                    <span>User Alerts</span>
                                  </label>
                                </div>
                                <a href="https://t.me/PawarPathLabBot" target="_blank" className="text-[10px] text-blue-500 hover:underline block text-center">Open @PawarPathLabBot & type /id to get ID</a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div
                  className="card-premium p-12 max-w-2xl mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
                    <Calendar className="text-clinical-rose" size={28} /> Clinical Calendar Management
                  </h3>
                  <form onSubmit={handleAddBlackout} className="space-y-4 mb-8">
                    <input
                      className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all placeholder:text-slate-400"
                      placeholder="Reason (e.g., Diwali, Maintenance)"
                      value={newBlackout.reason}
                      onChange={e => setNewBlackout({ ...newBlackout, reason: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="date"
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all"
                        value={newBlackout.startDate}
                        onChange={e => setNewBlackout({ ...newBlackout, startDate: e.target.value })}
                      />
                      <input
                        type="date"
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all"
                        value={newBlackout.endDate}
                        onChange={e => setNewBlackout({ ...newBlackout, endDate: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="w-full bg-clinical-rose text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-rose-lg hover:bg-clinical-rose-dark transition-all">Add Block</button>
                  </form>
                  <div className="space-y-4">
                    {blackoutDates.map(date => (
                      <div key={date._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
                        <div>
                          <p className="font-bold text-slate-900">{date.reason}</p>
                          <p className="text-xs text-slate-600">{date.startDate} to {date.endDate}</p>
                        </div>
                        <button onClick={() => handleDeleteBlackout(date._id)} className="p-2 hover:bg-clinical-rose-light rounded-lg transition-colors">
                          <Trash2 className="text-slate-500 hover:text-clinical-rose" size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main >

      {/* Review Report Modal */}
      <AnimatePresence>
        {
          reviewModalOpen && selectedBookingForReview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => !isProcessingReview && setReviewModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b-2 border-slate-200">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Review Report</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      {selectedBookingForReview.patientName} - {selectedBookingForReview.tests.map(t => t.title).join(' + ')}
                    </p>
                  </div>
                  <button
                    onClick={() => setReviewModalOpen(false)}
                    disabled={isProcessingReview}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <X className="w-6 h-6 text-slate-600" />
                  </button>
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 overflow-hidden p-6">
                  {selectedBookingForReview.reportFileUrl ? (
                    <iframe
                      src={`/api/reports/download/${selectedBookingForReview._id}`}
                      className="w-full h-full min-h-[500px] border-2 border-slate-200 rounded-xl"
                      title="Report Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <p>No report file available</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer with Actions */}
                <div className="p-6 border-t-2 border-slate-200 space-y-4">
                  {/* Reject Notes Input */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Rejection Notes (Required for Reject)
                    </label>
                    <textarea
                      value={rejectNotes}
                      onChange={(e) => setRejectNotes(e.target.value)}
                      placeholder="Enter notes for the partner about why the report is being rejected..."
                      className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all resize-none"
                      rows={3}
                      disabled={isProcessingReview}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleReleaseReport}
                      disabled={isProcessingReview}
                      className="flex-1 bg-success text-white px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-success/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessingReview ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Release Report
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleRejectReport}
                      disabled={isProcessingReview || !rejectNotes.trim()}
                      className="flex-1 bg-clinical-rose text-white px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-clinical-rose-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessingReview ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Reject / Re-upload
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        }
        {/* Partner Re-assignment Confirmation Modal */}
      </AnimatePresence >

      {/* Partner Re-assignment Confirmation Modal */}
      <AnimatePresence>
        {
          partnerReassignModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setPartnerReassignModal(prev => ({ ...prev, isOpen: false }))}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center mb-6 text-amber-500">
                  <HeartHandshake size={48} />
                </div>
                <h3 className="text-xl font-black text-slate-900 text-center mb-2">Confirm Re-assignment</h3>
                <p className="text-center text-slate-500 mb-8 font-medium">
                  Are you sure you want to re-assign this specimen from <br />
                  <span className="font-bold text-slate-900">{partnerReassignModal.currentPartnerName}</span> to <span className="font-bold text-clinical-rose">{partnerReassignModal.newPartnerName}</span>?
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => setPartnerReassignModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 bg-slate-100 text-slate-600 px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPartnerReassign}
                    className="flex-1 bg-clinical-rose text-white px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-clinical-rose-dark transition-all"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >

      {/* Rejection Modal for Pending Bookings */}
      <AnimatePresence>
        {
          rejectionModalOpen && selectedBookingForRejection && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => !isProcessingReview && setRejectionModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <XCircle className="text-clinical-rose" size={28} />
                    Reject Booking
                  </h2>
                  <button onClick={() => setRejectionModalOpen(false)} disabled={isProcessingReview} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} className="text-slate-400 hover:text-slate-600" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-slate-600 font-bold mb-2">Patient: <span className="text-slate-900">{selectedBookingForRejection.patientName}</span></p>
                  <p className="text-slate-500 text-sm">Please specify the reason for rejection. This will be sent to the user.</p>
                </div>

                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Reason (e.g., Use precise location, Service unavailable in area...)"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:border-clinical-rose focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all resize-none mb-6 h-32"
                  disabled={isProcessingReview}
                />

                <div className="flex gap-4">
                  <button
                    onClick={() => setRejectionModalOpen(false)}
                    disabled={isProcessingReview}
                    className="flex-1 bg-slate-100 text-slate-600 px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-slate-200 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRejection}
                    disabled={isProcessingReview || !rejectNotes.trim()}
                    className="flex-1 bg-clinical-rose text-white px-6 py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-clinical-rose-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessingReview ? <Loader2 className="animate-spin" /> : <XCircle size={18} />}
                    Confirm Reject
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >
      {/* Coupon Usage Insights Modal */}
      <AnimatePresence>
        {
          couponUsageModal.isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setCouponUsageModal(prev => ({ ...prev, isOpen: false }))}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b-2 border-slate-200">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                      <Ticket className="text-clinical-rose" />
                      Coupon Usage: {couponUsageModal.couponCode}
                    </h2>
                    <p className="text-sm text-slate-500 font-bold mt-1">
                      Used {couponUsageModal.matches.length} times
                    </p>
                  </div>
                  <button
                    onClick={() => setCouponUsageModal(prev => ({ ...prev, isOpen: false }))}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={24} className="text-slate-400 hover:text-slate-600" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {couponUsageModal.matches.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <p>No usages found for this coupon.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-500 rounded-l-lg">Date</th>
                          <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-500">Patient</th>
                          <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-500">Tests</th>
                          <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-500 text-right rounded-r-lg">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {couponUsageModal.matches.map(match => (
                          <tr key={match._id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-600 text-sm">
                              {new Date(match.createdAt || '').toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric'
                              })}
                            </td>
                            <td className="p-3 font-bold text-slate-900">{match.patientName}</td>
                            <td className="p-3 font-bold text-slate-500 text-xs">
                              {match.tests?.map(t => t.title).join(', ') || '-'}
                            </td>
                            <td className="p-3 font-bold text-slate-900 text-right">₹{match.totalAmount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >
      <AnimatePresence>
        {specimenModal.isOpen && (
          <motion.div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-clinical-rose">
              <FlaskConical className="text-clinical-rose mb-4" size={40} />
              <h3 className="text-2xl font-black text-slate-900 mb-2">Collect Specimen?</h3>
              <p className="text-slate-600 mb-6 font-medium">Verify you have collected the sample for <span className="font-bold text-slate-900">{specimenModal.patientName}</span>.</p>
              <div className="flex gap-4">
                <button onClick={() => setSpecimenModal({ ...specimenModal, isOpen: false })} className="flex-1 py-4 font-bold text-slate-500 uppercase tracking-widest text-xs">Cancel</button>
                <button onClick={() => {
                  handleUpdateStatus(specimenModal.bookingId, 'sample_collected');
                  setSpecimenModal({ ...specimenModal, isOpen: false });
                }} className="flex-1 bg-clinical-rose text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-rose-lg">Confirm Collection</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
}
