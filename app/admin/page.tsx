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
  ShieldCheck, LogOut, RefreshCw, Trash2, UserCheck, Settings2, Home, Loader2, Calendar, FileText, X, CheckCircle, XCircle, Ticket, MapPin, BellRing, Phone,
  LayoutDashboard, HeartHandshake, Settings as SettingsIcon, Info, Lock as LockIcon, TestTube, Clock, LayoutList
} from 'lucide-react';
import BookingSkeleton from '@/components/skeletons/BookingSkeleton';
import { FlaskConical } from 'lucide-react';
import { BookingStatus } from '@/types';
import PaginationControls from '@/components/ui/PaginationControls';
import CustomModal from '@/components/ui/CustomModal';
import StatusTracker from '@/components/StatusTracker';

interface BookingType {
  _id: string;
  patientName: string;
  totalAmount: number;
  balanceAmount: number;
  referredBy: string;
  status: string;
  tests: { title: string; category: string }[];
  assignedPartnerName?: string;
  assignedPartnerId?: string;
  reportFileUrl?: string;
  reportStatus?: string;
  pathologistNotes?: string;
  distanceFromLab?: number;
  couponCode?: string;
  collectionType?: string;
  createdAt?: string;
  address?: string;
  contactNumber?: string;
  bookingDate?: string; // Legacy support or alias
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
}

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Intelligence');
  const [bookings, setBookings] = useState<BookingType[]>([]);
  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, totalPages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [assignmentModal, setAssignmentModal] = useState<{
    isOpen: boolean;
    type: 'assign' | 'reassign' | 'unassign';
    booking: any | null;
    targetPartnerId: string;
    partnerName?: string;
  }>({ isOpen: false, type: 'assign', booking: null, targetPartnerId: '', partnerName: '' });

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt_desc');

  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartner, setNewPartner] = useState({ name: '', email: '', username: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>({ requireVerification: true });
  const [isVerified, setIsVerified] = useState(false);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDateType[]>([]);
  const [newBlackout, setNewBlackout] = useState({ reason: '', startDate: '', endDate: '' });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<BookingType | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isProcessingReview, setIsProcessingReview] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountType: 'percentage' as 'percentage' | 'fixed', value: 0, expiryDate: '', usageLimit: '' });

  // SaaS Analytics State
  const [analyticsData, setAnalyticsData] = useState<{ totalRevenue: number; bookingCount: number; dailyTrends: any[] }>({ totalRevenue: 0, bookingCount: 0, dailyTrends: [] });
  const [dateFilter, setDateFilter] = useState('week'); // today, week, month, custom
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  // Phase 4: Drive Provisioning
  const [provisioningStatus, setProvisioningStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [nextMonthAlert, setNextMonthAlert] = useState(false);
  const [provisionResult, setProvisionResult] = useState('');

  const { data: session, status } = useSession();

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
      fetchData();
      fetchPartners();
      fetchConfig();
      fetchBlackoutDates();
      fetchBlackoutDates();
      fetchCoupons();
      fetchCoupons();
      checkNextMonthProvisioning(); // New Check
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === 'authenticated' && activeTab === 'Intelligence') {
      fetchAnalytics();
    }
  }, [activeTab, dateFilter, customRange, status]);

  const fetchAnalytics = async () => {
    try {
      let start = new Date();
      let end = new Date();

      if (dateFilter === 'today') {
        start.setHours(0, 0, 0, 0);
      } else if (dateFilter === 'week') {
        start.setDate(start.getDate() - 7);
      } else if (dateFilter === 'month') {
        start.setDate(start.getDate() - 30);
      } else if (dateFilter === 'custom') {
        if (!customRange.start || !customRange.end) return;
        start = new Date(customRange.start);
        end = new Date(customRange.end);
      }

      const query = new URLSearchParams({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });

      const res = await fetch(`/api/admin/analytics?${query}`);
      if (res.ok) {
        setAnalyticsData(await res.json());
      }
    } catch (e) { console.error("Analytics fetch failed", e); }
  };

  const handlePartnerAction = (action: 'assign' | 'reassign' | 'unassign', booking: any, partnerId: string = '') => {
    const partnerName = partners.find(p => p._id === partnerId)?.name || '';
    setAssignmentModal({
      isOpen: true,
      type: action,
      booking,
      targetPartnerId: partnerId,
      partnerName
    });
  };

  const handleConfirmPartnerUpdate = async () => {
    try {
      const { booking, targetPartnerId, type, partnerName } = assignmentModal;
      if (!booking) return;

      const notify_new = type === 'assign' || type === 'reassign';
      const notify_prev = type === 'reassign' || type === 'unassign';

      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: type === 'unassign' ? 'accepted' : 'assigned',
          assignedPartnerName: type === 'unassign' ? null : partnerName,
          assignedPartnerId: type === 'unassign' ? null : targetPartnerId,
          notify_new_partner: notify_new,
          notify_previous_partner: notify_prev,
          previous_partner_name: booking.assignedPartnerName
        })
      });

      if (res.ok) {
        toast.success(type === 'unassign' ? 'Partner removed' : 'Partner assigned successfully');
        fetchData();
        setAssignmentModal(prev => ({ ...prev, isOpen: false }));
      } else {
        const err = await res.json();
        toast.error(err.error || 'Assignment failed');
      }
    } catch (e) {
      toast.error("Error updating assignment");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        statusTab: activeTab === 'Approvals' ? 'approvals' :
          activeTab === 'Active Bookings' ? 'active' :
            activeTab === 'Review Report' ? 'review' :
              activeTab === 'Completed Bookings' ? 'completed' : statusFilter,
        search: searchQuery,
        partnerId: partnerFilter,
        sortBy
      });
      const res = await fetch(`/api/bookings?${query}`);
      if (res.ok) {
        const data = await res.json();
        // Check if data is array (old) or object (new) - handling break
        if (Array.isArray(data)) {
          setBookings(data);
        } else {
          setBookings(data.bookings);
          setPaginationMeta(data.metadata);
        }
      }
      else if (res.status === 401 || res.status === 403) router.push('/login');
    } catch (error) {
      console.error('Failed to load admin data', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when items/filters changed
  useEffect(() => {
    if ((activeTab === 'Active Bookings' || activeTab === 'Completed Bookings' || activeTab === 'Approvals' || activeTab === 'Review Report') && status === 'authenticated') {
      fetchData();
    }
  }, [currentPage, limit, activeTab, statusFilter, partnerFilter, sortBy]); // Trigger on status filter change

  // Debounced Search Re-fetch
  useEffect(() => {
    if ((activeTab === 'Active Bookings' || activeTab === 'Completed Bookings' || activeTab === 'Approvals' || activeTab === 'Review Report') && status === 'authenticated') {
      const timer = setTimeout(() => {
        setCurrentPage(1); // Reset page on search
        fetchData();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/users?role=partner');
      if (res.ok) setPartners(await res.json());
      else if (res.status === 401 || res.status === 403) router.push('/login');
    } catch (error) {
      console.error('Failed to load partners', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) setConfig(await res.json());
      else if (res.status === 401 || res.status === 403) router.push('/login');
    } catch (err) { console.error(err); }
  };

  const updateConfig = async (newSettings: any) => {
    // Optimistic update
    setConfig(prev => ({ ...prev, ...newSettings }));

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (!res.ok) {
        throw new Error('Failed to update settings');
      }

      const updated = await res.json();
      setConfig(updated);
    } catch (err) {
      console.error("Failed to update config", err);
      alert("Failed to update settings. Please try again.");
      fetchConfig(); // Revert on error
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

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '' });
  const handleDeleteBlackout = async (id: string) => {
    // Logic moved to confirmation modal action
    try {
      const res = await fetch(`/api/settings/blackout-dates?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchBlackoutDates();
        setDeleteModal({ isOpen: false, id: '' });
        toast.success("Blackout date removed");
      } else {
        toast.error('Failed to delete blackout date.');
      }
    } catch (err) {
      toast.error('An error occurred while deleting blackout date.');
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
    couponId: string;
    couponCode: string;
    matches: BookingType[];
    isLoading: boolean;
    pagination: { page: number; totalPages: number; total: number; limit: number };
  }>({
    isOpen: false,
    couponId: '',
    couponCode: '',
    matches: [],
    isLoading: false,
    pagination: { page: 1, totalPages: 1, total: 0, limit: 10 }
  });

  const fetchCouponUsage = async (id: string, page: number = 1) => {
    setCouponUsageModal(prev => ({ ...prev, isLoading: true }));
    try {
      const res = await fetch(`/api/coupons/${id}/usage?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setCouponUsageModal(prev => ({
          ...prev,
          matches: data.matches,
          pagination: data.metadata,
          isLoading: false
        }));
      } else {
        toast.error("Failed to load usage data");
        setCouponUsageModal(prev => ({ ...prev, isLoading: false }));
      }
    } catch (e) {
      console.error(e);
      setCouponUsageModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleCheckUsage = (id: string, code: string) => {
    setCouponUsageModal({
      isOpen: true,
      couponId: id,
      couponCode: code,
      matches: [],
      isLoading: true,
      pagination: { page: 1, totalPages: 1, total: 0, limit: 10 }
    });
    fetchCouponUsage(id, 1);
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

  const handleToggleConfig = async () => {
    const newConfig = { ...config, requireVerification: !config.requireVerification };
    setConfig(newConfig);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig)
      });
      if (res.status === 401 || res.status === 403) router.push('/login');
    } catch (e) { console.error("Config save failed", e); }
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

  if (!session || (session.user.role !== 'admin' && session.user.role !== 'partner')) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row font-sans p-4 lg:p-8 gap-8 bg-slate-50"
    >
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

        <div className="flex-1 overflow-y-auto">
          <nav className="space-y-3">
            {[
              { id: 'Intelligence', icon: LayoutDashboard },
              { id: 'Approvals', icon: CheckCircle },
              { id: 'Active Bookings', icon: FlaskConical },
              { id: 'Review Report', icon: FileText },
              { id: 'Coupons', icon: Ticket },
              { id: 'Config', icon: SettingsIcon },
              { id: 'Completed Bookings', icon: CheckCircle },
              { id: 'Partners', icon: HeartHandshake }
            ].map(tab => {
              const isLocked = tab.id === 'Coupons' && !config?.planFlags?.allowCoupons && (session?.user?.role as any) !== 'master';
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id
                    ? 'bg-clinical-rose text-white shadow-rose-lg'
                    : 'text-slate-600 hover:text-clinical-rose hover:bg-clinical-rose-light'
                    }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{tab.id}</span>
                  {isLocked && <LockIcon className="w-4 h-4" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t-2 border-slate-200">
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all text-slate-600 hover:text-clinical-rose hover:bg-clinical-rose-light">
            <Home className="w-5 h-5" /> Homepage
          </button>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full mt-2 flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all text-slate-600 hover:text-clinical-rose hover:bg-clinical-rose-light">
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
                className="space-y-8"
              >
                {/* Date Filter Controls */}
                <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {['today', 'week', 'month', 'custom'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setDateFilter(filter)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${dateFilter === filter ? 'bg-white text-clinical-rose shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {dateFilter === 'custom' && (
                    <div className="flex items-center gap-2">
                      <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold" onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))} />
                      <span className="text-slate-400">-</span>
                      <input type="date" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold" onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))} />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <motion.div className="card-premium p-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-4">Total Revenue</p>
                    <p className="text-5xl font-black text-slate-900">₹{analyticsData.totalRevenue}</p>
                  </motion.div>
                  <motion.div className="card-premium p-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <p className="text-warning text-xs font-black uppercase tracking-widest mb-4">Total Bookings</p>
                    <p className="text-5xl font-black text-slate-900">{analyticsData.bookingCount}</p>
                  </motion.div>
                  <motion.div className="card-premium p-10 flex flex-col justify-end" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <p className="text-success text-xs font-black uppercase tracking-widest mb-4">Average Value</p>
                    <p className="text-4xl font-black text-slate-900">
                      ₹{analyticsData.bookingCount > 0 ? Math.round(analyticsData.totalRevenue / analyticsData.bookingCount) : 0}
                    </p>
                  </motion.div>
                </div>

                {/* Daily Trends Chart with Improved Visibility */}
                <div className="card-premium p-8">
                  <h3 className="text-xl font-black text-slate-900 mb-6">Daily Revenue Trends</h3>
                  <div className="h-64 flex items-end gap-3 px-4">
                    {analyticsData.dailyTrends.map((day, idx) => {
                      const maxRev = Math.max(...analyticsData.dailyTrends.map((d: any) => d.revenue)) || 1;
                      // Improved scaling: ensure even small amounts have a visible bar
                      const height = Math.max((day.revenue / maxRev) * 100, day.revenue > 0 ? 5 : 0);

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                          <div
                            className="w-full bg-clinical-rose rounded-t-lg transition-all duration-500 hover:bg-clinical-rose-dark shadow-sm"
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter w-full text-center group-hover:text-clinical-rose">
                            {new Date(day.date).getDate()} {new Date(day.date).toLocaleString('default', { month: 'short' })}
                          </span>
                          {/* Enhanced Tooltip */}
                          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] font-bold px-3 py-2 rounded-lg pointer-events-none transition-all scale-95 group-hover:scale-100 whitespace-nowrap z-10 shadow-xl">
                            {day.date}<br />
                            <span className="text-clinical-rose text-sm">₹{day.revenue}</span>
                          </div>
                        </div>
                      );
                    })}
                    {analyticsData.dailyTrends.length === 0 && (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-black uppercase tracking-widest gap-2">
                        <Info size={32} />
                        No data for period
                      </div>
                    )}
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
                className="relative"
              >
                {/* Lock and Blur Overlay */}
                {!config?.planFlags?.allowCoupons && (session?.user?.role as any) !== 'master' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md rounded-3xl"
                  >
                    <LockIcon size={64} className="text-slate-400 mb-4" />
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Feature Locked</h3>
                    <p className="text-slate-600 text-center max-w-md px-4 font-medium">
                      Coupon Management is a premium feature. Please contact your Master Admin to upgrade your plan.
                    </p>
                  </motion.div>
                )}

                {/* Content with conditional blur */}
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${!config?.planFlags?.allowCoupons && (session?.user?.role as any) !== 'master' ? 'opacity-20 blur-sm pointer-events-none select-none' : ''}`}>
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
                                onClick={() => handleCheckUsage(coupon._id, coupon.code)}
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {(activeTab === 'Active Bookings' || activeTab === 'Completed Bookings' || activeTab === 'Approvals' || activeTab === 'Review Report') && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 gap-4">

                  {/* Context Badges for Two-Gate System */}
                  {activeTab === 'Approvals' ? (
                    <div className="flex bg-amber-50 p-2 rounded-xl border border-amber-100 items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                      <span className="text-amber-700 font-bold text-xs uppercase tracking-wider">Pending Approvals</span>
                    </div>
                  ) : activeTab === 'Review Report' ? (
                    <div className="flex bg-amber-50 p-2 rounded-xl border border-amber-100 items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                      <span className="text-amber-700 font-bold text-xs uppercase tracking-wider">Awaiting Pathologist Sign-off</span>
                    </div>
                  ) : activeTab === 'Completed Bookings' ? (
                    <div className="flex bg-emerald-50 p-2 rounded-xl border border-emerald-100 items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider">Archive</span>
                    </div>
                  ) : (
                    <div className="flex bg-blue-50 p-2 rounded-xl border border-blue-100 items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-blue-700 font-bold text-xs uppercase tracking-wider">Live Operations</span>
                    </div>
                  )}

                  {/* Search and Filter Controls */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 md:flex-none">
                      <input
                        type="text"
                        placeholder="Search patient or ID..."
                        className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-clinical-rose/20 outline-none w-full md:w-72 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute left-3 top-3.5 text-slate-400">
                        <RefreshCw size={16} />
                      </div>
                    </div>

                    {/* Partner Filter - Only for Active and Completed Bookings */}
                    {activeTab !== 'Approvals' && (
                      <div className="relative">
                        <select
                          value={partnerFilter}
                          onChange={(e) => setPartnerFilter(e.target.value)}
                          className="appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all shadow-sm cursor-pointer min-w-[140px]"
                        >
                          <option value="">All Partners</option>
                          {partners.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-3.5 text-slate-400 pointer-events-none">
                          <HeartHandshake size={16} />
                        </div>
                      </div>
                    )}

                    {/* Sorting Dropdown */}
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 focus:ring-2 focus:ring-clinical-rose/20 outline-none transition-all shadow-sm cursor-pointer min-w-[160px]"
                      >
                        <option value="createdAt_desc">Newest First</option>
                        <option value="createdAt_asc">Oldest First</option>
                        <option value="patientName_asc">Name (A-Z)</option>
                        <option value="patientName_desc">Name (Z-A)</option>
                        <option value="totalAmount_desc">Amount (High-Low)</option>
                        <option value="totalAmount_asc">Amount (Low-High)</option>
                      </select>
                      <div className="absolute right-3 top-3.5 text-slate-400 pointer-events-none">
                        <LayoutList size={16} />
                      </div>
                    </div>
                  </div>
                </div>

                <PaginationControls
                  currentPage={currentPage}
                  totalPages={paginationMeta.totalPages}
                  limit={limit}
                  total={paginationMeta.total}
                  onPageChange={setCurrentPage}
                  onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
                />

                <div className="space-y-6 mt-6">
                  {loading ? (
                    Array(6).fill(null).map((_, i) => <BookingSkeleton key={i} />)
                  ) : bookings.length === 0 ? (
                    <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-200">
                      <p className="text-slate-500 font-bold">No bookings found matching your criteria.</p>
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking._id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-col md:flex-row gap-6 justify-between">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${booking.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                booking.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  booking.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                {booking.status}
                              </span>
                              <span className="text-xs font-bold text-slate-400">#{booking._id.slice(-6)}</span>
                              <span className="text-xs font-medium text-slate-500">{booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}</span>
                            </div>

                            <div>
                              <h4 className="text-xl font-black text-slate-900 leading-tight">{booking.patientName}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {booking.tests && booking.tests.map((t: any, idx: number) => (
                                  <span key={idx} className="bg-slate-50 text-slate-600 px-2 py-1 rounded-lg text-xs font-bold border border-slate-100">
                                    {t.title}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
                              <p className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center"><MapPin size={10} /></div> {booking.address || 'Lab Visit'}</p>
                              <p className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center"><Phone size={10} /></div> {booking.contactNumber}</p>
                            </div>

                            {/* Financials Block - Restored */}
                            <div className="flex gap-4 text-slate-900 border-t border-slate-100 pt-4 w-full max-w-sm">
                              <div className="flex-1">
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Total</p>
                                <p className="font-bold text-lg">₹{booking.totalAmount}</p>
                              </div>
                              <div className="flex-1">
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Balance</p>
                                <p className="font-bold text-lg text-clinical-rose">₹{booking.balanceAmount}</p>
                              </div>
                            </div>
                            {activeTab === 'Active Bookings' && (
                              <div className="w-full border-t border-slate-100 mt-4 pt-4">
                                <StatusTracker status={booking.status} reportStatus={booking.reportStatus || 'pending_review'} />

                                <div className="flex flex-wrap gap-2 mt-4 justify-start">
                                  {(booking.status === 'assigned' || booking.status === 'accepted' || booking.status === 'reached') && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(booking._id, 'sample_collected'); }}
                                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100 flex items-center gap-2 shadow-sm"
                                    >
                                      <TestTube size={14} /> Mark Specimen Taken
                                    </button>
                                  )}
                                  {booking.status === 'sample_collected' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(booking._id, 'processing'); }}
                                      className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all border border-purple-100 flex items-center gap-2 shadow-sm"
                                    >
                                      <Clock size={14} /> Receive In Lab
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                          </div>

                          <div className="flex flex-col gap-3 min-w-[200px] justify-center">
                            {activeTab === 'Approvals' && booking.status === 'pending' ? (
                              /* Approvals Workflow Buttons */
                              <div className="flex flex-col gap-3">
                                <button
                                  onClick={() => handleUpdateStatus(booking._id, 'accepted')}
                                  className="w-full bg-success text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-success/90 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                  <CheckCircle size={18} /> Approve Quest
                                </button>
                                <button
                                  onClick={() => handleOpenRejection(booking)}
                                  className="w-full bg-white text-clinical-rose border-2 border-clinical-rose px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-clinical-rose-light transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                  <XCircle size={18} /> Reject
                                </button>
                              </div>
                            ) : (
                              /* Standard/Active Booking Actions */
                              <>
                                {/* Unified Assignment UI for Active Bookings */}
                                {booking.status !== 'pending' && booking.status !== 'rejected' && booking.status !== 'cancelled' && activeTab !== 'Review Report' && activeTab !== 'Completed Bookings' && (
                                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mt-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 flex justify-between items-center">
                                      <span>
                                        {booking.assignedPartnerName ? (
                                          <>Assigned: <span className="text-blue-600 normal-case">{booking.assignedPartnerName}</span></>
                                        ) : (
                                          'Unassigned'
                                        )}
                                      </span>
                                      {booking.assignedPartnerName && (
                                        <button
                                          onClick={() => handlePartnerAction('unassign', booking)}
                                          className="text-red-400 hover:text-red-500 text-[10px] underline font-bold"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </label>
                                    <div className="relative">
                                      <div className={`absolute inset-y-0 left-3 flex items-center pointer-events-none ${booking.assignedPartnerName ? 'text-blue-500' : 'text-slate-400'}`}>
                                        <HeartHandshake size={14} />
                                      </div>
                                      <select
                                        className={`w-full appearance-none pl-9 pr-4 py-2 text-xs font-bold rounded-xl border outline-none cursor-pointer transition-all ${booking.assignedPartnerName
                                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                                          : 'bg-white border-slate-200 text-slate-500'
                                          } ${(!config?.planFlags?.allowPartnerReassignment && !!booking.assignedPartnerId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        value={booking.assignedPartnerId || ""}
                                        disabled={!config?.planFlags?.allowPartnerReassignment && !!booking.assignedPartnerId}
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            if (booking.assignedPartnerId) {
                                              // Re-assign
                                              handlePartnerAction('reassign', booking, e.target.value);
                                            } else {
                                              // New Assign
                                              handlePartnerAction('assign', booking, e.target.value);
                                            }
                                          }
                                        }}
                                      >
                                        <option value="" disabled>
                                          {!config?.planFlags?.allowPartnerReassignment && !!booking.assignedPartnerId
                                            ? '🔒 Assignment Locked'
                                            : booking.assignedPartnerName
                                              ? 'Change Partner...'
                                              : 'Select Partner...'}
                                        </option>
                                        {partners.map(p => (
                                          <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                )}

                                {/* Review Report Tab: Show Review & Approve Button */}
                                {activeTab === 'Review Report' && booking.status === 'report_uploaded' && (
                                  <button
                                    onClick={() => { setSelectedBookingForReview(booking); setReviewModalOpen(true); }}
                                    className="w-full py-3 bg-clinical-rose text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-rose-lg hover:bg-clinical-rose-dark transition-all flex items-center justify-center gap-2"
                                  >
                                    <FileText size={16} /> Review & Approve
                                  </button>
                                )}

                                {/* Completed Bookings Tab: Show View Final Report Button */}
                                {activeTab === 'Completed Bookings' && booking.status === 'completed' && (
                                  <button
                                    onClick={() => window.open(booking.reportFileUrl || '#', '_blank')}
                                    className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs uppercase tracking-widest border-2 border-emerald-200 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                                  >
                                    <FileText size={16} /> View Final Report
                                  </button>
                                )}



                                {/* Rejection/Cancellation for non-completed items */}
                                {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.status !== 'rejected' && activeTab !== 'Approvals' && activeTab !== 'Review Report' && (
                                  <div className="flex gap-2 justify-end mt-2">
                                    <button
                                      onClick={() => { setSelectedBookingForRejection(booking); setRejectionModalOpen(true); }}
                                      className="px-3 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                                      title="Reject Booking"
                                    >
                                      <XCircle size={16} /> Cancel
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )))}
                </div>

                <div className="mt-8">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={paginationMeta.totalPages}
                    limit={limit}
                    total={paginationMeta.total}
                    onPageChange={setCurrentPage}
                    onLimitChange={(l) => { setLimit(l); setCurrentPage(1); }}
                  />
                </div>
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
                      System Configuration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* Verification Toggle */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
                        {!(config as any).planFlags?.allowVerification && (session?.user?.role as any) !== 'master' && (
                          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                            <LockIcon className="text-slate-400 mb-2" size={20} />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Locked</p>
                          </div>
                        )}
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
                              checked={config.requireVerification}
                              onChange={(e) => updateConfig({ requireVerification: e.target.checked })}
                              disabled={!(config as any).planFlags?.allowVerification && (session?.user?.role as any) !== 'master'}
                            />
                            <label
                              htmlFor="verification-toggle"
                              className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${config.requireVerification ? 'bg-clinical-rose' : 'bg-slate-300'}`}
                            ></label>
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${config.requireVerification ? 'translate-x-6' : '0'}`}></div>
                          </div>
                        </div>
                      </div>

                      {/* SMS Notifications */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
                        {!(config as any).planFlags?.allowSms && (session?.user?.role as any) !== 'master' && (
                          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                            <LockIcon className="text-slate-400 mb-2" size={20} />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Locked</p>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-slate-900">SMS Notifications</h4>
                            <p className="text-xs text-slate-500 mt-1">Send updates via SMS</p>
                          </div>
                          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                            <input
                              type="checkbox"
                              id="sms-toggle"
                              className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                              checked={(config as any).smsEnabled ?? true}
                              onChange={(e) => updateConfig({ smsEnabled: e.target.checked })}
                              disabled={!(config as any).planFlags?.allowSms && (session?.user?.role as any) !== 'master'}
                            />
                            <label
                              htmlFor="sms-toggle"
                              className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${(config as any).smsEnabled !== false ? 'bg-clinical-rose' : 'bg-slate-300'}`}
                            ></label>
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${(config as any).smsEnabled !== false ? 'translate-x-6' : '0'}`}></div>
                          </div>
                        </div>
                      </div>

                      {/* Email Notifications */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
                        {!(config as any).planFlags?.allowEmail && (session?.user?.role as any) !== 'master' && (
                          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                            <LockIcon className="text-slate-400 mb-2" size={20} />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Locked</p>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-slate-900">Email Notifications</h4>
                            <p className="text-xs text-slate-500 mt-1">Send updates via Email</p>
                          </div>
                          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                            <input
                              type="checkbox"
                              id="email-toggle"
                              className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                              checked={(config as any).emailEnabled ?? true}
                              onChange={(e) => updateConfig({ emailEnabled: e.target.checked })}
                              disabled={!(config as any).planFlags?.allowEmail && (session?.user?.role as any) !== 'master'}
                            />
                            <label
                              htmlFor="email-toggle"
                              className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${(config as any).emailEnabled !== false ? 'bg-clinical-rose' : 'bg-slate-300'}`}
                            ></label>
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${(config as any).emailEnabled !== false ? 'translate-x-6' : '0'}`}></div>
                          </div>
                        </div>
                      </div>

                      {/* Block Sundays */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
                        {!(config as any).planFlags?.allowSundayBookings && (session?.user?.role as any) !== 'master' && (
                          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                            <LockIcon className="text-slate-400 mb-2" size={20} />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Locked</p>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                              Block Sundays
                              {!(config as any).planFlags?.allowSundayBookings && (session?.user?.role as any) !== 'master' && <span className="bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Locked</span>}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Disable booking on Sundays</p>
                          </div>
                          <div className={`relative inline-block w-12 h-6 transition duration-200 ease-in-out ${!(config as any).planFlags?.allowSundayBookings && (session?.user?.role as any) !== 'master' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                              type="checkbox"
                              id="sunday-toggle"
                              className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                              checked={(config as any).blockSundays ?? true}
                              onChange={(e) => {
                                if (!(config as any).planFlags?.allowSundayBookings && (session?.user?.role as any) !== 'master') {
                                  toast.error("Upgrade your plan to enable Sunday bookings");
                                  return;
                                }
                                updateConfig({ blockSundays: e.target.checked });
                              }}
                              disabled={!(config as any).planFlags?.allowSundayBookings && (session?.user?.role as any) !== 'master'}
                            />
                            <label
                              htmlFor="sunday-toggle"
                              className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${(config as any).blockSundays !== false ? 'bg-clinical-rose' : 'bg-slate-300'}`}
                            ></label>
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${(config as any).blockSundays !== false ? 'translate-x-6' : '0'}`}></div>
                          </div>
                        </div>
                      </div>

                      {/* Coupons Feature */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
                        {!(config as any).planFlags?.allowCoupons && (session?.user?.role as any) !== 'master' && (
                          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                            <LockIcon className="text-slate-400 mb-2" size={20} />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Locked</p>
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-slate-900">Coupon Management</h4>
                            <p className="text-xs text-slate-500 mt-1">Enable discount coupons for users</p>
                          </div>
                          <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                            <input
                              type="checkbox"
                              id="coupons-toggle"
                              className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                              checked={(config as any).couponsEnabled ?? true}
                              onChange={(e) => updateConfig({ couponsEnabled: e.target.checked })}
                              disabled={!(config as any).planFlags?.allowCoupons && (session?.user?.role as any) !== 'master'}
                            />
                            <label
                              htmlFor="coupons-toggle"
                              className={`block w-full h-full rounded-full transition-colors duration-300 ease-in-out ${(config as any).couponsEnabled !== false ? 'bg-clinical-rose' : 'bg-slate-300'}`}
                            ></label>
                            <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out shadow-sm ${(config as any).couponsEnabled !== false ? 'translate-x-6' : '0'}`}></div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Maintenance */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 md:col-span-2 relative overflow-hidden">
                        {!(config as any).planFlags?.allowMaintenanceConfig && (session?.user?.role as any) !== 'master' && (
                          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                            <LockIcon className="text-slate-400 mb-2" size={24} />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Maintenance Config Locked</p>
                          </div>
                        )}
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><ShieldCheck size={18} /> System Maintenance</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div><h5 className="font-bold text-xs uppercase tracking-wide text-slate-700">Patient Portal</h5><p className="text-[10px] text-slate-500">Block patient access</p></div>
                            <div className="relative inline-block w-10 h-5"><input type="checkbox" className="peer absolute w-full h-full opacity-0 cursor-pointer" checked={(config as any).maintenanceModeUser ?? false} onChange={(e) => updateConfig({ maintenanceModeUser: e.target.checked })} disabled={!(config as any).planFlags?.allowMaintenanceConfig && (session?.user?.role as any) !== 'master'} /><span className={`block w-full h-full rounded-full transition ${(config as any).maintenanceModeUser ? 'bg-rose-500' : 'bg-slate-300'}`}></span><span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition transform ${(config as any).maintenanceModeUser ? 'translate-x-5' : ''}`}></span></div>
                          </div>
                          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div><h5 className="font-bold text-xs uppercase tracking-wide text-slate-700">Partner Portal</h5><p className="text-[10px] text-slate-500">Block partner access</p></div>
                            <div className="relative inline-block w-10 h-5"><input type="checkbox" className="peer absolute w-full h-full opacity-0 cursor-pointer" checked={(config as any).maintenanceModePartner ?? false} onChange={(e) => updateConfig({ maintenanceModePartner: e.target.checked })} disabled={!(config as any).planFlags?.allowMaintenanceConfig && (session?.user?.role as any) !== 'master'} /><span className={`block w-full h-full rounded-full transition ${(config as any).maintenanceModePartner ? 'bg-rose-500' : 'bg-slate-300'}`}></span><span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition transform ${(config as any).maintenanceModePartner ? 'translate-x-5' : ''}`}></span></div>
                          </div>
                        </div>
                      </div>

                      {/* Smart Notification Hub */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 md:col-span-2">
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><BellRing size={18} /> Smart Notification Hub</h4>
                        <div className="space-y-4">
                          {/* WhatsApp Section */}
                          <div className="relative p-4 bg-white rounded-xl border border-slate-100 overflow-hidden">
                            {!(config as any).planFlags?.allowWhatsApp && (session?.user?.role as any) !== 'master' && (
                              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                                <LockIcon className="text-slate-400 mb-2" size={20} />
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">WhatsApp Locked</p>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <div>
                                <h5 className="font-bold text-sm text-slate-800">WhatsApp Integration</h5>
                                <p className="text-xs text-slate-500">Enable WhatsApp messaging</p>
                              </div>
                              <div className={`relative inline-block w-10 h-5 ${!(config as any).planFlags?.allowWhatsApp && (session?.user?.role as any) !== 'master' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input
                                  type="checkbox"
                                  className="peer absolute w-full h-full opacity-0 cursor-pointer"
                                  checked={(config as any).whatsappEnabled ?? true}
                                  onChange={(e) => {
                                    if (!(config as any).planFlags?.allowWhatsApp && (session?.user?.role as any) !== 'master') {
                                      toast.error("Premium Feature Locked. Contact Master Admin.");
                                      return;
                                    }
                                    updateConfig({ whatsappEnabled: e.target.checked });
                                  }}
                                  disabled={!(config as any).planFlags?.allowWhatsApp && (session?.user?.role as any) !== 'master'}
                                />
                                <span className={`block w-full h-full rounded-full transition ${(config as any).whatsappEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition transform ${(config as any).whatsappEnabled ? 'translate-x-5' : ''}`}></span>
                              </div>
                            </div>
                            {(config as any).whatsappEnabled && (
                              <div className="pl-4 border-l-2 border-slate-200 ml-2 mt-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <input type="checkbox" id="wa-official" checked={(config as any).whatsappOfficialEnabled ?? false} onChange={(e) => updateConfig({ whatsappOfficialEnabled: e.target.checked })} className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500" />
                                  <label htmlFor="wa-official" className="text-xs font-bold text-slate-700">Use Official Cloud API (Costs apply)</label>
                                </div>
                                <p className="text-[10px] text-slate-500">If unchecked, system sends Email with a "Chat on WhatsApp" deep-link (Free).</p>
                              </div>
                            )}
                          </div>

                          {/* Telegram Section */}
                          <div className="relative p-4 bg-white rounded-xl border border-slate-100 overflow-hidden">
                            {!(config as any).planFlags?.allowTelegram && (session?.user?.role as any) !== 'master' && (
                              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                                <LockIcon className="text-slate-400 mb-2" size={20} />
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Telegram Locked</p>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <div>
                                <h5 className="font-bold text-sm text-slate-800">Telegram Staff Alerts</h5>
                                <p className="text-xs text-slate-500">Internal alerts for new bookings</p>
                              </div>
                              <div className={`relative inline-block w-10 h-5 ${!(config as any).planFlags?.allowTelegram && (session?.user?.role as any) !== 'master' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <input type="checkbox" className="peer absolute w-full h-full opacity-0 cursor-pointer" checked={(config as any).telegramEnabled ?? false} onChange={(e) => updateConfig({ telegramEnabled: e.target.checked })} disabled={!(config as any).planFlags?.allowTelegram && (session?.user?.role as any) !== 'master'} />
                                <span className={`block w-full h-full rounded-full transition ${(config as any).telegramEnabled ? 'bg-sky-500' : 'bg-slate-300'}`}></span>
                                <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition transform ${(config as any).telegramEnabled ? 'translate-x-5' : ''}`}></span>
                              </div>
                            </div>
                            {(config as any).telegramEnabled && (
                              <div className="space-y-4 pt-3">
                                <input type="text" placeholder="Admin Chat ID" value={(config as any).telegramAdminChatId || ''} onChange={(e) => updateConfig({ telegramAdminChatId: e.target.value })} className="w-full text-xs px-3 py-2 border rounded-lg" />
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={(config as any).telegramEnabledAdmin ?? false} onChange={(e) => updateConfig({ telegramEnabledAdmin: e.target.checked })} />
                                    <span>Admin Alerts</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={(config as any).telegramEnabledPartner ?? false} onChange={(e) => updateConfig({ telegramEnabledPartner: e.target.checked })} />
                                    <span>Partner Alerts</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input type="checkbox" checked={(config as any).telegramEnabledUser ?? false} onChange={(e) => updateConfig({ telegramEnabledUser: e.target.checked })} />
                                    <span>User Alerts</span>
                                  </label>
                                </div>
                                <a href="https://t.me/PawarPathLabBot" target="_blank" className="text-[10px] text-blue-500 hover:underline block text-center">Open @PawarPathLabBot & type /id to get ID</a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>


                      {/* Google Drive Provisioning (Phase 4) */}
                      <div className={`relative p-6 rounded-2xl border ${nextMonthAlert ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'} md:col-span-1 overflow-hidden`}>
                        {/* Locked Overlay */}
                        {!(config as any).planFlags?.allowDriveInfrastructure && (session?.user?.role as any) !== 'master' && (
                          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                            <LockIcon className="text-slate-400 mb-2" size={24} />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Feature Locked</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Upgrade Plan</p>
                          </div>
                        )}

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
                              disabled={provisioningStatus === 'loading' || (!(config as any).planFlags?.allowDriveInfrastructure && (session?.user?.role as any) !== 'master')}
                              className={`mt-4 w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${nextMonthAlert ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                              {provisioningStatus === 'loading' ? <Loader2 className="animate-spin" /> : 'Provision Next Month'}
                            </button>
                            {provisioningStatus === 'success' && <p className="text-xs text-green-600 font-bold mt-2 text-center">✓ {provisionResult}</p>}
                          </div>
                        </div>
                      </div>

                      {/* System Maintenance & Broadcast Hub */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 md:col-span-2 relative overflow-hidden">
                        {/* Locked Overlay */}
                        {!(config as any).planFlags?.allowMaintenanceConfig && (session?.user?.role as any) !== 'master' && (
                          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                            <LockIcon className="text-slate-400 mb-2" size={32} />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Maintenance Controls Locked</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Upgrade your SaaS Plan</p>
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600"><Settings2 size={24} /></div>
                          <div>
                            <h4 className="font-bold text-slate-900">Operational Controls</h4>
                            <p className="text-xs text-slate-500">Manage site availability and announcements</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Broadcast Hub */}
                          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                              <div>
                                <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                  Global Broadcast <Info size={12} className="text-slate-400" />
                                </h5>
                                <p className="text-[10px] text-slate-500">Homepage Banner</p>
                              </div>
                              <div className="relative inline-block w-10 h-5">
                                <input
                                  type="checkbox"
                                  className="peer absolute w-full h-full opacity-0 cursor-pointer"
                                  checked={(config as any).broadcastEnabled ?? false}
                                  onChange={(e) => updateConfig({ broadcastEnabled: e.target.checked })}
                                  disabled={!(config as any).planFlags?.allowMaintenanceConfig && (session?.user?.role as any) !== 'master'}
                                />
                                <span className={`block w-full h-full rounded-full transition-colors ${(config as any).broadcastEnabled ? 'bg-clinical-rose' : 'bg-slate-300'}`}></span>
                                <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${(config as any).broadcastEnabled ? 'translate-x-5' : ''}`}></span>
                              </div>
                            </div>
                            <AnimatePresence>
                              {(config as any).broadcastEnabled && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                  <textarea
                                    value={(config as any).broadcastMessage || ''}
                                    onChange={e => updateConfig({ broadcastMessage: e.target.value })}
                                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg resize-none outline-none focus:border-clinical-rose bg-slate-50 focus:bg-white transition-colors"
                                    rows={3}
                                    placeholder="Enter announcement text..."
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Maintenance Mode */}
                          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-5">
                            {/* Patient Lock */}
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-800">Patient Lock (Maintenance)</span>
                                <div className="relative inline-block w-10 h-5">
                                  <input
                                    type="checkbox"
                                    className="peer absolute w-full h-full opacity-0 cursor-pointer"
                                    checked={(config as any).maintenanceModeUser ?? false}
                                    onChange={(e) => updateConfig({ maintenanceModeUser: e.target.checked })}
                                    disabled={!(config as any).planFlags?.allowMaintenanceConfig && (session?.user?.role as any) !== 'master'}
                                  />
                                  <span className={`block w-full h-full rounded-full transition-colors ${(config as any).maintenanceModeUser ? 'bg-indigo-600' : 'bg-slate-300'}`}></span>
                                  <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${(config as any).maintenanceModeUser ? 'translate-x-5' : ''}`}></span>
                                </div>
                              </div>
                              {(config as any).maintenanceModeUser && (
                                <input
                                  type="text"
                                  value={(config as any).maintenanceMessageUser || ''}
                                  onChange={e => updateConfig({ maintenanceMessageUser: e.target.value })}
                                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
                                  placeholder="Message for patients..."
                                />
                              )}
                            </div>

                            {/* Partner Lock */}
                            <div className="pt-4 border-t border-slate-100">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-slate-800">Partner Portal Lock</span>
                                <div className="relative inline-block w-10 h-5">
                                  <input
                                    type="checkbox"
                                    className="peer absolute w-full h-full opacity-0 cursor-pointer"
                                    checked={(config as any).maintenanceModePartner ?? false}
                                    onChange={(e) => updateConfig({ maintenanceModePartner: e.target.checked })}
                                    disabled={!(config as any).planFlags?.allowMaintenanceConfig && (session?.user?.role as any) !== 'master'}
                                  />
                                  <span className={`block w-full h-full rounded-full transition-colors ${(config as any).maintenanceModePartner ? 'bg-indigo-600' : 'bg-slate-300'}`}></span>
                                  <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${(config as any).maintenanceModePartner ? 'translate-x-5' : ''}`}></span>
                                </div>
                              </div>
                              {(config as any).maintenanceModePartner && (
                                <input
                                  type="text"
                                  value={(config as any).maintenanceMessagePartner || ''}
                                  onChange={e => updateConfig({ maintenanceMessagePartner: e.target.value })}
                                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white"
                                  placeholder="Message for partners..."
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Geographic Fencing */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 md:col-span-2 relative overflow-hidden">
                        {!(config as any).planFlags?.allowGeofencing && (session?.user?.role as any) !== 'master' && (
                          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                            <LockIcon className="text-slate-400 mb-2" size={24} />
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Geofencing Locked</p>
                          </div>
                        )}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-bold text-slate-900">Geographic Fencing</h4>
                              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                <input
                                  type="checkbox"
                                  id="fencing-toggle"
                                  className="peer absolute left-0 top-0 w-full h-full opacity-0 z-10 cursor-pointer"
                                  checked={(config as any).locationFencingEnabled ?? false}
                                  onChange={(e) => updateConfig({ locationFencingEnabled: e.target.checked })}
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
                                onChange={(e) => updateConfig({ serviceRadius: Number(e.target.value) })}
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
                                    onClick={() => updateConfig({ distanceType: 'displacement' })}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${(config as any).distanceType === 'displacement' || !(config as any).distanceType ? 'bg-white shadow-sm text-clinical-rose' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    Displacement
                                  </button>
                                  <button
                                    onClick={() => updateConfig({ distanceType: 'road' })}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${(config as any).distanceType === 'road' ? 'bg-white shadow-sm text-clinical-rose' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    Road (OSRM)
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <motion.div
                  className="card-premium p-12 max-w-2xl mt-8 relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Locked Overlay */}
                  {!(config as any).planFlags?.allowBlackoutManagement && (session?.user?.role as any) !== 'master' && (
                    <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center text-center p-4">
                      <LockIcon className="text-slate-400 mb-2" size={32} />
                      <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Calendar Management Locked</p>
                      <p className="text-xs text-slate-400 font-bold mt-1">Upgrade your SaaS Plan</p>
                    </div>
                  )}

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
        </div >
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
                      Rejection Notes {config?.planFlags?.requireCancellationReason ? '(Required)' : '(Optional)'}
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
                      disabled={isProcessingReview || (!!config?.planFlags?.requireCancellationReason && !rejectNotes.trim())}
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

      {/* Assignment Modal (Generic) */}
      <CustomModal
        isOpen={assignmentModal.isOpen}
        onClose={() => setAssignmentModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmPartnerUpdate}
        title={
          assignmentModal.type === 'assign' ? 'Confirm Assignment' :
            assignmentModal.type === 'reassign' ? 'Change Partner Assignment' :
              'Remove Partner'
        }
        description={
          assignmentModal.type === 'assign' ? `Assign this booking to ${assignmentModal.partnerName}? They will be notified immediately.` :
            assignmentModal.type === 'reassign' ? `Warning: You are switching assignment from ${assignmentModal.booking?.assignedPartnerName} to ${assignmentModal.partnerName}. Both partners will be notified.` :
              `Are you sure you want to remove ${assignmentModal.booking?.assignedPartnerName} from this booking? They will be notified of the cancellation.`
        }
        variant={assignmentModal.type === 'reassign' ? 'warning' : assignmentModal.type === 'unassign' ? 'danger' : 'default'}
        confirmText={assignmentModal.type === 'unassign' ? 'Remove Partner' : 'Confirm Assignment'}
      />

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
                    disabled={isProcessingReview || (!!config?.planFlags?.requireCancellationReason && !rejectNotes.trim())}
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
                      Total Bookings: {couponUsageModal.pagination?.total || 0}
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
                  {couponUsageModal.isLoading ? (
                    <div className="flex justify-center items-center h-48">
                      <Loader2 className="animate-spin text-clinical-rose w-8 h-8" />
                    </div>
                  ) : couponUsageModal.matches.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <p>No usages found for this coupon.</p>
                    </div>
                  ) : (
                    <>
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-500 rounded-l-lg">Date</th>
                            <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-500">Patient</th>
                            <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-500">Contact</th>
                            <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-500">Financials</th>
                            <th className="p-3 text-xs font-black uppercase tracking-widest text-slate-500 text-right rounded-r-lg">Paid</th>
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
                              <td className="p-3 font-bold text-slate-900">
                                <div>{match.patientName}</div>
                                <div className="text-[10px] text-slate-400 font-medium">{match.bookedByEmail || match.email}</div>
                              </td>
                              <td className="p-3">
                                <div className="text-xs font-bold text-slate-700">{match.contactNumber}</div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col text-xs">
                                  <span className="text-slate-400 line-through">₹{match.totalAmount + (match.discountAmount || 0)}</span>
                                  <span className="text-success font-bold">-₹{match.discountAmount}</span>
                                </div>
                              </td>
                              <td className="p-3 font-bold text-slate-900 text-right">₹{match.totalAmount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination for Modal */}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-500">
                          Page {couponUsageModal.pagination.page} of {couponUsageModal.pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => fetchCouponUsage(couponUsageModal.couponId, couponUsageModal.pagination.page - 1)}
                            disabled={couponUsageModal.pagination.page <= 1}
                            className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-slate-50"
                          >
                            Prev
                          </button>
                          <button
                            onClick={() => fetchCouponUsage(couponUsageModal.couponId, couponUsageModal.pagination.page + 1)}
                            disabled={couponUsageModal.pagination.page >= couponUsageModal.pagination.totalPages}
                            className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-50 hover:bg-slate-50"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )
        }
      </AnimatePresence >
      <CustomModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '' })}
        onConfirm={() => handleDeleteBlackout(deleteModal.id)}
        title="Delete Blackout Date"
        description="Are you sure you want to remove this blackout period? This will allow bookings during this time."
        confirmText="Remove"
        variant="danger"
      />
    </div >
  );
}
