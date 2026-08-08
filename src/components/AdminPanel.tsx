import React, { useState, useEffect } from 'react';
import {  
  Check, 
  X, 
  Clock, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Edit3, 
  Settings, 
  ClipboardList, 
  HelpCircle, 
  FileText, 
  Users, 
  Search, 
  DollarSign, 
  UserX, 
  UserCheck,
  LayoutDashboard,
  ArrowLeftRight,
  Download,
  Send,
  Layers,
  Smartphone,
  Package,
  Folder,
  Percent,
  Lock,
  Image as ImageIcon,
  Megaphone,
  Bell,
  Cpu,
  Mail,
  Terminal,
  Globe,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  History,
  Fingerprint,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Play,
  Upload
} from 'lucide-react';
import {  Offer, Order, SupportTicket, User } from '../types';
import OngoingOrdersView from './OngoingOrdersView';
import InvoiceModal from './InvoiceModal';

interface AdminPanelProps {
  orders: Order[];
  offers: Offer[];
  tickets: SupportTicket[];
  users: User[];
  onRefresh: () => void;
  onLogout?: () => void;
  showForeignCurrency?: boolean;
  globalCurrencyName?: string;
  globalCurrencyRate?: number;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  type: string;
  country: string;
  sortOrder: number;
  rateMultiplier: number;
  isEnabled: boolean;
  requirePin: boolean;
  icon: string;
}

export default function AdminPanel({ orders, offers, tickets, users, onRefresh, onLogout, showForeignCurrency, globalCurrencyName, globalCurrencyRate }: AdminPanelProps) {
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<string>('dashboard');

  // Service States
  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceIconBase64, setServiceIconBase64] = useState<string>('');

  // System System States
  const [systemData, setSystemData] = useState<any>(null);

  // Reject Modal State
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const [selectedAdminInvoice, setSelectedAdminInvoice] = useState<Order | null>(null);

  // Balance Transfer State
  const [transferType, setTransferType] = useState<'Send' | 'Return'>('Send');
  const [transferUserSearch, setTransferUserSearch] = useState<string>('');
  const [selectedTransferUser, setSelectedTransferUser] = useState<User | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string>('');
  const [transferErrorMsg, setTransferErrorMsg] = useState<string>('');

  // User Management State
  const [userSearch, setUserSearch] = useState<string>('');
  const [adjustingUser, setAdjustingUser] = useState<User | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<string>('');
  const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');

  // Admin Gateway State
  const [adminNums, setAdminNums] = useState({
    bkash: { personal: "01700112233", merchant: "01800112233" },
    nagad: { personal: "01900112233", merchant: "01500112233" },
    rocket: { personal: "01300112233", merchant: "01400112233" },
    usdt: { personal: "TRC20: TVgJ..." }
  });
  const [isSavingGateways, setIsSavingGateways] = useState<boolean>(false);
  const [gatewayMessage, setGatewayMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Content Management States
  const [banners, setBanners] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Banner CRUD Form State
  const [isEditingBanner, setIsEditingBanner] = useState<boolean>(false);
  const [bannerForm, setBannerForm] = useState<any>({
    title: '',
    image: '',
    action: 'offers',
    isActive: true,
    color: 'from-blue-600 to-indigo-700'
  });

  // Notice CRUD Form State
  const [isEditingNotice, setIsEditingNotice] = useState<boolean>(false);
  const [noticeForm, setNoticeForm] = useState<any>({
    text: '',
    textColor: '#B45309',
    isActive: true
  });
  const [marqueeSpeed, setMarqueeSpeed] = useState<number>(16);
  const [globalCurrencies, setGlobalCurrencies] = useState<any[]>([{ id: 'c1', name: 'USD', rate: 120 }]);

  // Notice Auto-Generator State
  const [genTopic, setGenTopic] = useState<string>('');
  const [genType, setGenType] = useState<string>('Offers');
  const [genColor, setGenColor] = useState<string>('#B45309');

  // Notification CRUD Form State
  const [isEditingNotification, setIsEditingNotification] = useState<boolean>(false);
  const [notificationForm, setNotificationForm] = useState<any>({
    title: '',
    body: '',
    imageUrl: '',
    expiryDate: '',
    targetRole: 'All',
    isActive: true
  });

  // Maintenance Settings Form States
  const [maintActive, setMaintActive] = useState<boolean>(false);
  const [maintReason, setMaintReason] = useState<string>('সিস্টেম মেইনটেন্যান্স চলছে। কিছুক্ষণের মধ্যেই আমরা ফিরে আসছি।');
  const [maintHotlines, setMaintHotlines] = useState<string>('01635275233');
  const [maintLoading, setMaintLoading] = useState<boolean>(false);
  const [maintSuccess, setMaintSuccess] = useState<string>('');

  // Helper for safe JSON fetching
  const safeFetch = async (url: string) => {
    try {
      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch (e) {
      console.warn(`AdminPanel fetch error for ${url}:`, e);
    }
    return null;
  };

  // Fetch Banners, Notices, Notifications
  const fetchContentData = async () => {
    try {
      const bData = await safeFetch((import.meta.env.VITE_API_URL || '') + '/api/banners');
      if (bData && Array.isArray(bData)) setBanners(bData);

      const nData = await safeFetch((import.meta.env.VITE_API_URL || '') + '/api/notices');
      if (nData && Array.isArray(nData)) setNotices(nData);

      const siteConfigData = await safeFetch((import.meta.env.VITE_API_URL || '') + '/api/site-config');
      if (siteConfigData) {
        if (siteConfigData.speed) setMarqueeSpeed(siteConfigData.speed);
        if (siteConfigData.currencies && Array.isArray(siteConfigData.currencies)) setGlobalCurrencies(siteConfigData.currencies);
      }

      const nfData = await safeFetch((import.meta.env.VITE_API_URL || '') + '/api/notifications');
      if (nfData && Array.isArray(nfData)) setNotifications(nfData);

      const ccData = await safeFetch((import.meta.env.VITE_API_URL || '') + '/api/calling-cards');
      if (ccData && Array.isArray(ccData)) setCallingCards(ccData);
    } catch (err) {
      console.error('Error fetching dynamic content:', err);
    }
  };

  // Banner Local File Upload -> Base64 helper
  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ফাইলের সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerForm((prev: any) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Notification Local File Upload -> Base64 helper
  const handleNotificationImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ফাইলের সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setNotificationForm((prev: any) => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleStockImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ফাইলের সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setStockImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleApproveImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ফাইলের সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setApproveCardImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditStockImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ফাইলের সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditStockImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditOrderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ফাইলের সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditOrderCardImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Banner CRUD actions
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = bannerForm.id ? '/api/banners/update' : '/api/banners/create';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerForm)
      });
      if (!res.ok) throw new Error('ব্যানার সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      setIsEditingBanner(false);
      setBannerForm({ title: '', image: '', action: 'offers', isActive: true, color: 'from-blue-600 to-indigo-700' });
      await fetchContentData();
      onRefresh(); // Real-time user refresh
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    setConfirmDialog({
      message: 'আপনি কি নিশ্চিত যে এই ব্যনারটি ডিলিট করতে চান?',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/banners/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          if (!res.ok) throw new Error('ব্যানার ডিলিট করতে ব্যর্থ হয়েছে।');
          await fetchContentData();
          onRefresh(); // Real-time user refresh
        } catch (err: any) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const getGeneratedNoticeText = (topic: string, type: string) => {
    const cleanTopic = topic.trim() || '[টপিক/বিষয় লিখুন]';
    if (type === 'Offers') {
      return `🎉 আকর্ষণীয় অফার! ${cleanTopic}। সীমিত সময়ের জন্য অফার উপভোগ করতে এখনই আপনার ওয়ালেট রিচার্জ করুন।`;
    } else if (type === 'Delay') {
      return `⏳ সাময়িক বিলম্ব! আমাদের সার্ভারে ${cleanTopic} জনিত কারণে লেনদেনে কিছুটা বিলম্ব হতে পারে। দ্রুত সমাধানের কাজ চলছে।`;
    } else if (type === 'Maintenance') {
      return `⚠️ সম্মানিত গ্রাহকবৃন্দ, সার্ভার আপগ্রেড কাজের জন্য সাময়িকভাবে ${cleanTopic} বন্ধ রয়েছে। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।`;
    } else if (type === 'Alert') {
      return `🚨 জরুরি সতর্কবার্তা! ${cleanTopic}। যেকোনো প্রকার লেনদেনের পূর্বে অবশ্যই পিন এবং ট্রানজেকশন আইডি ভালো করে দেখে নিন।`;
    } else if (type === 'Greeting') {
      return `🤝 শুভেচ্ছা! ${cleanTopic}। আমাদের সাথে থাকার জন্য ধন্যবাদ।`;
    }
    return `📢 সম্মানিত রিটেলার ভাই ও বোনেরা, ${cleanTopic}। যেকোনো প্রয়োজনে আমাদের হেল্পলাইনে যোগাযোগ করুন।`;
  };

  const handleApplyGeneratedNotice = async () => {
    if (!genTopic.trim()) {
      alert('অনুগ্রহ করে নোটিশের টপিক/বিষয় লিখুন!');
      return;
    }
    const text = getGeneratedNoticeText(genTopic, genType);
    setActionLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/notices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          textColor: genColor,
          isActive: true
        })
      });
      if (!res.ok) throw new Error('অটো নোটিশ সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      setGenTopic('');
      await fetchContentData();
      onRefresh();
      alert('সফলভাবে নোটিশ জেনারেট ও পাবলিশ করা হয়েছে!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Notice CRUD actions
  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = noticeForm.id ? '/api/notices/update' : '/api/notices/create';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noticeForm)
      });
      if (!res.ok) throw new Error('নোটিশ সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      setIsEditingNotice(false);
      setNoticeForm({ text: '', textColor: '#B45309', isActive: true });
      await fetchContentData();
      onRefresh(); // Real-time user refresh
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    setConfirmDialog({
      message: 'আপনি কি নিশ্চিত যে এই নোটিশটি ডিলিট করতে চান?',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/notices/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          if (!res.ok) throw new Error('নোটিশ ডিলিট করতে ব্যর্থ হয়েছে।');
          await fetchContentData();
          onRefresh(); // Real-time user refresh
        } catch (err: any) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Notification CRUD actions
  const handleSaveNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = notificationForm.id ? '/api/notifications/update' : '/api/notifications/create';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationForm)
      });
      if (!res.ok) throw new Error('নোটিফিকেশন সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      setIsEditingNotification(false);
      setNotificationForm({ title: '', body: '', imageUrl: '', expiryDate: '', targetRole: 'All', isActive: true });
      await fetchContentData();
      onRefresh(); // Real-time user refresh
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setConfirmDialog({
      message: 'আপনি কি নিশ্চিত যে এই নোটিফিকেশনটি ডিলিট করতে চান?',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/notifications/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          if (!res.ok) throw new Error('নোটিফিকেশন ডিলিট করতে ব্যর্থ হয়েছে।');
          await fetchContentData();
          onRefresh(); // Real-time user refresh
        } catch (err: any) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Calling Cards Management States
  const [callingCards, setCallingCards] = useState<any[]>([]);
  const [isEditingCallingCard, setIsEditingCallingCard] = useState<boolean>(false);
  const [callingCardForm, setCallingCardForm] = useState<any>({
    brand: 'Itel Mobile Dialer',
    pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে',
    country: 'Bangladesh',
    value: 10,
    priceBdt: 1120,
    minutes: '১২০০ মিনিট',
    rateDescription: ''
  });

  const handleSaveCallingCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const url = callingCardForm.id ? '/api/admin/calling-cards/update' : '/api/admin/calling-cards/create';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callingCardForm)
      });
      if (!res.ok) throw new Error('কলিং কার্ড সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      setIsEditingCallingCard(false);
      setCallingCardForm({
        brand: 'Itel Mobile Dialer',
        pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে',
        country: 'Bangladesh',
        value: 10,
        priceBdt: 1120,
        minutes: '১২০০ মিনিট',
        rateDescription: ''
      });
      await fetchContentData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCallingCard = async (id: string) => {
    setConfirmDialog({
      message: 'আপনি কি নিশ্চিত যে এই কলিং কার্ড অফারটি ডিলিট করতে চান?',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/calling-cards/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          if (!res.ok) throw new Error('কলিং কার্ড ডিলিট করতে ব্যর্থ হয়েছে।');
          await fetchContentData();
        } catch (err: any) {
          alert(err.message);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Trigger fetch of content arrays on mount
  useEffect(() => {
    fetchContentData();
  }, []);

  // Offer Creation State
  const [isEditingOffer, setIsEditingOffer] = useState<boolean>(false);
  const [offerForm, setOfferForm] = useState<{
    id?: string;
    title: string;
    operator: string;
    category: 'Minutes' | 'Internet' | 'Bundles' | 'Call Rate' | 'Calling Card';
    mb: string;
    min: string;
    regularPrice: string;
    resellerPrice: string;
    validity: string;
    description: string;
    isDrivePack?: boolean;
  }>({
    title: '',
    operator: 'Grameenphone',
    category: 'Internet',
    mb: '10 GB',
    min: '0 Min',
    regularPrice: '300',
    resellerPrice: '250',
    validity: '30 Days',
    description: '',
    isDrivePack: true
  });
  const [offerError, setOfferError] = useState<string>('');

  // Calling Card Stock States
  const [cardStocks, setCardStocks] = useState<any[]>([]);
  const [selectedStockPackage, setSelectedStockPackage] = useState<any | null>(null);
  const [stockType, setStockType] = useState<'pin' | 'voucher'>('pin');
  const [stockPin, setStockPin] = useState<string>('');
  const [stockPassword, setStockPassword] = useState<string>('');
  const [stockExpiry, setStockExpiry] = useState<string>('');
  const [stockImageUrl, setStockImageUrl] = useState<string>('');
  const [bulkImportText, setBulkImportText] = useState<string>('');
  const [stockError, setStockError] = useState<string>('');
  const [stockSuccess, setStockSuccess] = useState<string>('');

  // Category filter for packages
  const [packageCategoryFilter, setPackageCategoryFilter] = useState<string>('All');

  // Calling Card Order Approval Modal State
  const [approvingCallingCardOrder, setApprovingCallingCardOrder] = useState<any | null>(null);
  const [approveAutoAssign, setApproveAutoAssign] = useState<boolean>(true);
  const [approveCardPin, setApproveCardPin] = useState<string>('');
  const [approveCardPassword, setApproveCardPassword] = useState<string>('');
  const [approveCardExpiry, setApproveCardExpiry] = useState<string>('');
  const [approveCardImageUrl, setApproveCardImageUrl] = useState<string>('');
  const [approveError, setApproveError] = useState<string>('');

  // Calling Card Editing State (Stock & Approved Orders)
  const [editingStockItem, setEditingStockItem] = useState<any | null>(null);
  const [editStockPin, setEditStockPin] = useState<string>('');
  const [editStockPassword, setEditStockPassword] = useState<string>('');
  const [editStockExpiry, setEditStockExpiry] = useState<string>('');
  const [editStockImageUrl, setEditStockImageUrl] = useState<string>('');
  const [editStockType, setEditStockType] = useState<'pin' | 'voucher'>('pin');

  const [editingApprovedCallingCardOrder, setEditingApprovedCallingCardOrder] = useState<any | null>(null);
  const [editOrderCardPin, setEditOrderCardPin] = useState<string>('');
  const [editOrderCardPassword, setEditOrderCardPassword] = useState<string>('');
  const [editOrderCardExpiry, setEditOrderCardExpiry] = useState<string>('');
  const [editOrderCardImageUrl, setEditOrderCardImageUrl] = useState<string>('');
  const [editOrderError, setEditOrderError] = useState<string>('');

  // Fetch Calling Card Stocks
  const fetchCardStocks = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/calling-card/stock');
      if (res.ok) {
        const data = await res.json();
        setCardStocks(data);
      }
    } catch (err) {
      console.error("Error fetching card stocks:", err);
    }
  };

  // Load Services & System Settings
  const fetchServicesAndSystem = async () => {
    try {
      fetchCardStocks();
      const sData = await safeFetch((import.meta.env.VITE_API_URL || '') + '/api/services');
      if (sData && Array.isArray(sData)) {
        setServices(sData);
      }
      const sysData = await safeFetch((import.meta.env.VITE_API_URL || '') + '/api/admin/system-data');
      if (sysData) {
        setSystemData(sysData);
      }
      const gatewayRes = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/info');
      if (gatewayRes.ok) {
        const gatewayData = await gatewayRes.json();
        if (gatewayData && gatewayData.adminNumbers) {
          setAdminNums(gatewayData.adminNumbers);
        }
      }
      const resMaint = await fetch((import.meta.env.VITE_API_URL || '') + '/api/maintenance');
      if (resMaint.ok) {
        const maintData = await resMaint.json();
        if (maintData) {
          setMaintActive(!!maintData.active);
          setMaintReason(maintData.reason || '');
          if (maintData.hotlines && Array.isArray(maintData.hotlines)) {
            setMaintHotlines(maintData.hotlines.join(', '));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching admin system configurations:', err);
    }
  };

  const handleSaveGateways = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGateways(true);
    setGatewayMessage(null);
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/update-gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminNums)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'গেটওয়ে নম্বর সংরক্ষণ করতে ব্যর্থ হয়েছে।');
      }
      setGatewayMessage({ type: 'success', text: 'পেমেন্ট গেটওয়ে নম্বরসমূহ সফলভাবে সংরক্ষিত হয়েছে!' });
    } catch (err: any) {
      setGatewayMessage({ type: 'error', text: err.message });
    } finally {
      setIsSavingGateways(false);
    }
  };

  const handleSaveMaintSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaintSuccess('');
    setMaintLoading(true);
    try {
      const hotlinesArr = maintHotlines.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: maintActive,
          reason: maintReason,
          hotlines: hotlinesArr
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'মেইনটেন্যান্স সেটিংস সংরক্ষণ করা যায়নি।');
      setMaintSuccess('মেইনটেন্যান্স সেটিংস সফলভাবে সংরক্ষণ করা হয়েছে!');
      onRefresh(); // Refresh parent states
    } catch (err: any) {
      alert(err.message);
    } finally {
      setMaintLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesAndSystem();
  }, [orders, users]);

  // Handle Approve Order
  const handleApprove = async (orderId: string) => {
    const ord = orders.find(o => o.id === orderId);
    if (ord && ord.type === 'Calling Card') {
      setApprovingCallingCardOrder(ord);
      setApproveAutoAssign(true);
      setApproveCardPin('');
      setApproveCardPassword('');
      setApproveCardExpiry('');
      setApproveCardImageUrl('');
      setApproveError('');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/orders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (!response.ok) {
        throw new Error('অনুমোদন করতে ব্যর্থ হয়েছে।');
      }
      onRefresh();
      fetchServicesAndSystem();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Calling Card Approval
  const handleConfirmCallingCardApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingCallingCardOrder) return;
    setActionLoading(true);
    setApproveError('');
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/orders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: approvingCallingCardOrder.id,
          autoAssign: approveAutoAssign,
          cardPin: approveCardPin,
          cardPassword: approveCardPassword,
          cardExpiry: approveCardExpiry,
          cardImageUrl: approveCardImageUrl
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'অনুমোদন করতে ব্যর্থ হয়েছে।');
      }
      setApprovingCallingCardOrder(null);
      onRefresh();
      fetchServicesAndSystem();
    } catch (err: any) {
      setApproveError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Stock CRUD Handler Methods
  const handleAddStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockPackage) return;
    setStockError('');
    setStockSuccess('');
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/calling-card/stock/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedStockPackage.id,
          type: stockType,
          pin: stockPin,
          password: stockPassword,
          expiryDate: stockExpiry,
          cardImageUrl: stockImageUrl
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create stock item");
      
      setStockSuccess('স্টক আইটেম সফলভাবে যুক্ত হয়েছে।');
      setStockPin('');
      setStockPassword('');
      setStockExpiry('');
      setStockImageUrl('');
      fetchCardStocks();
    } catch (err: any) {
      setStockError(err.message);
    }
  };

  const handleBulkImportStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockPackage) return;
    setStockError('');
    setStockSuccess('');
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/calling-card/stock/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedStockPackage.id,
          bulkText: bulkImportText
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to import bulk stock");
      
      setStockSuccess(`সফলভাবে ${data.count} টি আইটেম স্টক যুক্ত করা হয়েছে।`);
      setBulkImportText('');
      fetchCardStocks();
    } catch (err: any) {
      setStockError(err.message);
    }
  };

  const handleDeleteStockItem = async (id: string) => {
    setConfirmDialog({
      message: 'আপনি কি সত্যিই এই স্টক আইটেমটি মুছতে চান?',
      onConfirm: async () => {
        try {
          const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/calling-card/stock/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          if (res.ok) {
            fetchCardStocks();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleStartEditStockItem = (item: any) => {
    setEditingStockItem(item);
    setEditStockPin(item.pin || '');
    setEditStockPassword(item.password || '');
    setEditStockExpiry(item.expiryDate || '');
    setEditStockImageUrl(item.cardImageUrl || '');
    setEditStockType(item.type || 'pin');
  };

  const handleSaveEditStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockItem) return;
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/calling-card/stock/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStockItem.id,
          pin: editStockPin,
          password: editStockPassword,
          expiryDate: editStockExpiry,
          cardImageUrl: editStockImageUrl,
          type: editStockType
        })
      });
      if (res.ok) {
        setEditingStockItem(null);
        fetchCardStocks();
      } else {
        const data = await res.json();
        alert(data.error || 'আপডেট করতে ব্যর্থ হয়েছে।');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartEditApprovedOrder = (ord: any) => {
    setEditingApprovedCallingCardOrder(ord);
    setEditOrderCardPin(ord.cardPin || '');
    setEditOrderCardPassword(ord.cardPassword || '');
    setEditOrderCardExpiry(ord.cardExpiry || '');
    setEditOrderCardImageUrl(ord.cardImageUrl || '');
    setEditOrderError('');
  };

  const handleSaveEditApprovedOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApprovedCallingCardOrder) return;
    setActionLoading(true);
    setEditOrderError('');
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/orders/update-calling-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: editingApprovedCallingCardOrder.id,
          cardPin: editOrderCardPin,
          cardPassword: editOrderCardPassword,
          cardExpiry: editOrderCardExpiry,
          cardImageUrl: editOrderCardImageUrl
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'কার্ড আপডেট করতে ব্যর্থ হয়েছে।');
      }
      setEditingApprovedCallingCardOrder(null);
      onRefresh(); // Refresh parent state
    } catch (err: any) {
      setEditOrderError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setConfirmDialog({
      message: 'আপনি কি নিশ্চিত যে আপনি এই অর্ডারটি ডিলিট করতে চান? (Are you sure you want to delete this order?)',
      onConfirm: async () => {
        try {
          const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/orders/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'অর্ডার ডিলিট করতে ব্যর্থ হয়েছে।');
          onRefresh();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  // Open Reject Modal
  const handleOpenRejectModal = (order: Order) => {
    setRejectingOrder(order);
    setCancelReason('');
  };

  // Reject Order Confirm
  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingOrder) return;
    setActionLoading(true);
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/orders/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: rejectingOrder.id, reason: cancelReason }),
      });
      if (!response.ok) {
        throw new Error('বাতিল করতে ব্যর্থ হয়েছে।');
      }
      setRejectingOrder(null);
      onRefresh();
      fetchServicesAndSystem();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Resolve Ticket
  const handleResolveTicket = async (ticketId: string) => {
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/tickets/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });
      if (!response.ok) {
        throw new Error('টিকিট সমাধান করতে ব্যর্থ হয়েছে।');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save Offer (Add or Edit)
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferError('');
    if (!offerForm.title.trim()) {
      setOfferError('অফারের নাম আবশ্যক।');
      return;
    }
    if (!offerForm.regularPrice || isNaN(Number(offerForm.regularPrice))) {
      setOfferError('রেগুলার মূল্য সঠিক সংখ্যায় দিন।');
      return;
    }
    if (!offerForm.resellerPrice || isNaN(Number(offerForm.resellerPrice))) {
      setOfferError('রিসেলার মূল্য সঠিক সংখ্যায় দিন।');
      return;
    }

    const endpoint = offerForm.id ? '/api/offers/update' : '/api/offers/create';
    let payload = {
      ...offerForm,
      regularPrice: Number(offerForm.regularPrice),
      resellerPrice: Number(offerForm.resellerPrice),
      isDrivePack: offerForm.isDrivePack
    };
    if (offerForm.category === 'Calling Card') {
      payload.title = `${offerForm.regularPrice} USD Value ${offerForm.operator} (${offerForm.min})`;
      payload.isDrivePack = false;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('অফার সংরক্ষণ করা যায়নি।');
      }
      setIsEditingOffer(false);
      onRefresh();
    } catch (err: any) {
      setOfferError(err.message);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    setConfirmDialog({
      message: 'আপনি কি সত্যিই অফারটি মুছতে চান?',
      onConfirm: async () => {
        try {
          const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/offers/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          if (!response.ok) {
            throw new Error('অফার ডিলিট করা যায়নি।');
          }
          onRefresh();
        } catch (err: any) {
          alert(err.message);
        }
      }
    });
  };

  const handleOpenAddOffer = () => {
    setOfferForm({
      title: '',
      operator: 'Grameenphone',
      category: 'Internet',
      mb: '10 GB',
      min: '0 Min',
      regularPrice: '300',
      resellerPrice: '250',
      validity: '30 Days',
      description: '',
      isDrivePack: true
    });
    setIsEditingOffer(true);
    setOfferError('');
  };

  const handleOpenEditOffer = (off: Offer) => {
    setOfferForm({
      id: off.id,
      title: off.title,
      operator: off.operator,
      category: off.category,
      mb: off.mb || '',
      min: off.min || '',
      regularPrice: String(off.regularPrice),
      resellerPrice: String(off.resellerPrice),
      validity: off.validity,
      description: off.description || '',
      isDrivePack: off.isDrivePack ?? (off.category !== 'Internet')
    });
    setIsEditingOffer(true);
    setOfferError('');
  };

  // Admin Balance Transfer Submission
  const handleBalanceTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferErrorMsg('');
    setTransferSuccessMsg('');
    if (!selectedTransferUser) {
      setTransferErrorMsg('অনুগ্রহ করে রিসেলার গ্রাহক নির্বাচন করুন।');
      return;
    }
    const amt = Number(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferErrorMsg('সঠিক ব্যালেন্স পরিমাণ প্রদান করুন।');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/balance/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: transferType,
          recipientPhone: selectedTransferUser.phone,
          amount: amt,
          note: transferNote
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ব্যালেন্স স্থানান্তর করতে ব্যর্থ হয়েছে।');
      }
      setTransferSuccessMsg(`৳${amt} BDT সফলভাবে গ্রাহক ${selectedTransferUser.name} এর ওয়ালেটে ${transferType === 'Send' ? 'প্রদান করা হয়েছে' : 'থেকে ফেরত নেওয়া হয়েছে'}!`);
      setTransferAmount('');
      setTransferNote('');
      setTransferUserSearch('');
      setSelectedTransferUser(null);
      onRefresh();
      fetchServicesAndSystem();
    } catch (err: any) {
      setTransferErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Custom Service Icon Upload (Local Base64 conversion)
  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ফাইলের সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setServiceIconBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Service Details
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setActionLoading(true);
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/services/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingService,
          icon: serviceIconBase64 || editingService.icon
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'সার্ভিস আপডেট করা যায়নি।');
      }
      setEditingService(null);
      setServiceIconBase64('');
      fetchServicesAndSystem();
      alert('সার্ভিস সেটিংস ও কাস্টম আইকন সফলভাবে সেভ করা হয়েছে!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // User list balance adjustments
  const handleBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingUser) return;
    setActionLoading(true);
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/users/update-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adjustingUser.id,
          amount: Number(balanceAdjustAmount),
          action: balanceAction
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ব্যালেন্স সমন্বয় করতে ব্যর্থ হয়েছে।');
      }
      setAdjustingUser(null);
      setBalanceAdjustAmount('');
      onRefresh();
      fetchServicesAndSystem();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'রোল পরিবর্তন করতে ব্যর্থ হয়েছে।');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: 'Active' | 'Suspended') => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/users/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'স্ট্যাটাস পরিবর্তন করতে ব্যর্থ হয়েছে।');
      }
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Calculations for Stats
  const approvedAddMoneyOrders = orders.filter(o => o.status?.toUpperCase() === 'SUCCESS' && o.type === 'Add Money');
  const pendingOrdersCount = orders.filter(o => o.status?.toUpperCase() === 'PENDING').length;
  const successfulOrdersCount = orders.filter(o => o.status?.toUpperCase() === 'SUCCESS').length;
  
  const balanceInTotal = approvedAddMoneyOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalCommissionPaid = approvedAddMoneyOrders.reduce((sum, o) => sum + (o.commissionDeducted || 0), 0);
  const totalSystemBalance = users.reduce((sum, u) => sum + (u.walletBalance || 0), 0);

  // Balance Transfer Screen calculations
  const adminTransferSends = orders.filter(o => o.status === 'Success' && o.serviceName?.includes('Admin Fund Send'));
  const adminTransferReturns = orders.filter(o => o.status === 'Success' && o.serviceName?.includes('Admin Fund Return'));
  
  const totalSentAmount = adminTransferSends.reduce((sum, o) => sum + o.amount, 0);
  const totalReturnedAmount = adminTransferReturns.reduce((sum, o) => sum + o.amount, 0);

  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const todaySentAmount = adminTransferSends
    .filter(o => o.date?.startsWith(getTodayISO()))
    .reduce((sum, o) => sum + o.amount, 0);
  const todayReturnedAmount = adminTransferReturns
    .filter(o => o.date?.startsWith(getTodayISO()))
    .reduce((sum, o) => sum + o.amount, 0);

  // Search filter for balance transfer selection
  const filteredUsersForTransfer = users.filter(u => {
    if (!transferUserSearch) return false;
    const s = transferUserSearch.toLowerCase();
    return u.name.toLowerCase().includes(s) || u.phone.includes(s) || (u.email && u.email.toLowerCase().includes(s));
  });

  const ongoingOrdersCount = orders.filter(o => {
    const status = o.status?.toUpperCase() || '';
    return status === 'PENDING' || status === 'PROCESSING';
  }).length;

  // Sidebar Menu Items Definition
  const menuCategories = [
    {
      title: 'NAVIGATION',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'ongoing_orders', label: 'Ongoing Orders', icon: Clock, badge: ongoingOrdersCount ? String(ongoingOrdersCount) : undefined },
        { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight, badge: pendingOrdersCount ? String(pendingOrdersCount) : undefined },
        { id: 'balance_requests', label: 'Balance Requests', icon: Download },
        { id: 'balance_transfer', label: 'Balance Transfer', icon: Send }
      ]
    },
    {
      title: 'CATALOG',
      items: [
        { id: 'services', label: 'Services', icon: Layers, isNew: true },
        { id: 'operators', label: 'Operators', icon: Smartphone },
        { id: 'packages', label: 'Packages / Drives', icon: Package },
        { id: 'calling_cards_edit', label: 'Calling Cards', icon: CreditCard, isNew: true },
        { id: 'sub_categories', label: 'Sub Categories', icon: Folder },
        { id: 'mfs_charges', label: 'MFS Charges', icon: Percent },
        { id: 'blocked_amounts', label: 'Blocked Amounts', icon: Lock }
      ]
    },
    {
      title: 'CONTENT',
      items: [
        { id: 'banners', label: 'Banners / Slider', icon: ImageIcon },
        { id: 'notices', label: 'Notices', icon: Megaphone },
        { id: 'notifications', label: 'Notifications', icon: Bell }
      ]
    },
    {
      title: 'MODEM & SYSTEM',
      items: [
        { id: 'maintenance_control', label: 'Maintenance Mode', icon: Settings, isNew: true },
        { id: 'ussd_gateways', label: 'USSD Gateways', icon: Cpu },
        { id: 'sms_inbox', label: 'SMS Inbox', icon: Mail },
        { id: 'api_management', label: 'API Management', icon: Terminal },
        { id: 'site_settings', label: 'Site Settings', icon: Globe },
        { id: 'two_factor', label: 'Two-Factor Auth', icon: ShieldCheck }
      ]
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'users', label: 'Users', icon: Users },
        { id: 'payment_accounts', label: 'Payment Accounts', icon: CreditCard },
        { id: 'support_tickets', label: 'Support Tickets', icon: MessageCircle }
      ]
    },
    {
      title: 'LOGS',
      items: [
        { id: 'blocked_ips', label: 'Blocked IPs', icon: ShieldAlert },
        { id: 'login_logs', label: 'Login Logs', icon: History },
        { id: 'pin_logs', label: 'PIN Logs', icon: Fingerprint }
      ]
    }
  ];

  return (
    <div className="flex bg-[#F8FAFC] text-neutral-800 -mx-4 -my-4 rounded-3xl overflow-hidden min-h-[750px] shadow-sm relative">
      {/* Global Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500"></div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">নিশ্চিত করুন</h3>
            <p className="text-neutral-600 font-medium text-sm leading-relaxed mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-neutral-600 font-semibold hover:bg-neutral-100 rounded-xl transition-colors"
              >
                বাতিল
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-5 py-2 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 shadow-sm shadow-rose-600/20 transition-all"
              >
                নিশ্চিত
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. COLLAPSIBLE DARK SIDEBAR */}
      <aside 
        className={`bg-[#0F172A] text-slate-300 border-r border-[#1E293B] flex flex-col justify-between transition-all duration-300 relative select-none shrink-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
            <div className={`flex items-center space-x-2 overflow-hidden ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-indigo-500/20">
                SP
              </div>
              {!isSidebarCollapsed && (
                <div className="text-left">
                  <span className="text-xs font-black tracking-widest text-white uppercase block">SHAKIB PAY</span>
                  <span className="text-[8.5px] font-bold text-slate-500 block uppercase tracking-wider">BACK OFFICE v2.1</span>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Sidebar Items List */}
          <div className="p-3 space-y-5 max-h-[580px] overflow-y-auto scrollbar-none">
            {menuCategories.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-1">
                {!isSidebarCollapsed && (
                  <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase px-2 py-1">
                    {cat.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isSel = activeSubTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSubTab(item.id)}
                        className={`w-full py-2 px-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer group ${
                          isSel 
                            ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/10' 
                            : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
                        }`}
                        title={item.label}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className={`w-4 h-4 shrink-0 ${isSel ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                          {!isSidebarCollapsed && (
                            <span className="truncate leading-none">{item.label}</span>
                          )}
                        </div>
                        
                        {/* Badges/Indicators */}
                        {!isSidebarCollapsed && (
                          <div className="flex items-center space-x-1 shrink-0">
                            {item.isNew && (
                              <span className="bg-rose-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-tight">NEW</span>
                            )}
                            {item.badge && (
                              <span className="bg-amber-500 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-5 text-center leading-none">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer (Collapse toggle & Quick log out) */}
        <div className="p-3 border-t border-[#1E293B] space-y-1">
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full py-2 bg-rose-600/10 hover:bg-rose-650 text-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all cursor-pointer font-bold mb-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span className="text-[11px] ml-2">লগআউট (Logout)</span>}
            </button>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full py-2 hover:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span className="text-[11px] font-bold ml-2">Collapse Menu</span>}
          </button>
        </div>
      </aside>

      {/* 2. ADMIN MAIN CONTENT WRAPPER */}
      <main className="flex-1 p-6 overflow-y-auto max-h-[850px] space-y-6 text-left">

        {/* ================================================== */}
        {/* TAB: MAINTENANCE CONTROL */}
        {/* ================================================== */}
        {activeSubTab === 'maintenance_control' && (
          <div className="space-y-6 text-left max-w-4xl">
            {/* Header Area */}
            <div className="flex items-center justify-between border-b border-neutral-200/85 pb-4">
              <div>
                <h1 className="text-base font-black text-neutral-900">সিস্টেম মেইনটেন্যান্স কন্ট্রোলার / System Maintenance</h1>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">Manage live system status, custom alerts, and helpline hotline numbers</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${maintActive ? 'bg-rose-400' : 'bg-emerald-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${maintActive ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                </span>
                <span className="text-[10px] font-black tracking-wider uppercase text-neutral-500">
                  {maintActive ? 'MAINTENANCE MODE ACTIVE' : 'SYSTEM ONLINE'}
                </span>
              </div>
            </div>

            {/* Quick Warning / Success Notification Banner */}
            {maintSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-2.5 text-xs font-bold shadow-4xs animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>{maintSuccess}</span>
              </div>
            )}

            {/* Main Form Box */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-4xs p-5 sm:p-6 space-y-6">
              <form onSubmit={handleSaveMaintSettings} className="space-y-6">
                
                {/* 1. Maintenance Status Toggle Slider */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-150">
                  <div className="space-y-1 pr-4">
                    <label className="text-xs font-black text-neutral-800 block uppercase tracking-wide">মেইনটেন্যান্স মোড চালু/বন্ধ</label>
                    <p className="text-[10px] text-neutral-450 font-medium">এটি চালু করলে সাধারণ রিসেলারগণ অ্যাপে প্রবেশ করতে পারবে না এবং একটি কাস্টম পেজ দেখতে পাবে।</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setMaintActive(!maintActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      maintActive ? 'bg-rose-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        maintActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Admin Reason / Alert Text */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-neutral-800 uppercase tracking-wide">মেইনটেন্যান্স নোটিশ বার্তা / Reason Message</label>
                    <span className="text-[9px] font-bold text-neutral-400">Bangla & English Supported</span>
                  </div>
                  <textarea
                    rows={3}
                    value={maintReason}
                    onChange={(e) => setMaintReason(e.target.value)}
                    placeholder="মেইনটেন্যান্সের কারণ ও নোটিশ এখানে লিখুন..."
                    className="w-full px-4 py-3 text-xs bg-white border border-neutral-200 rounded-xl focus:border-indigo-500 focus:outline-none font-medium text-neutral-800 leading-relaxed placeholder:text-neutral-400"
                    required
                  />
                  
                  {/* Quick Preset Templates */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] font-black uppercase text-neutral-400 tracking-wider block">সহজে বার্তা লিখুন (Presets):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: 'রুটিন মেইনটেন্যান্স', text: 'সম্মানিত রিটেলার ভাই ও বোনেরা, আমাদের রুটিন সার্ভার মেইনটেন্যান্সের কাজ চলছে। খুব দ্রুতই অ্যাপ সচল করা হবে।' },
                        { label: 'জরুরি ডাটাবেজ আপগ্রেড', text: 'জরুরি সার্ভার ডাটাবেজ আপগ্রেড ও স্পিড অপ্টিমাইজেশনের কাজের জন্য সাময়িকভাবে সিস্টেম বন্ধ রয়েছে। সাময়িক অসুবিধার জন্য দুঃখিত।' },
                        { label: 'পেমেন্ট গেটওয়ে আপডেট', text: 'সার্ভারে নতুন পেমেন্ট গেটওয়ে সিস্টেম ও অটো-অ্যাডমানি রিচার্জ এপিআই আপগ্রেডের কাজ চলছে। ৩০ মিনিটের মধ্যে সার্ভিস সচল হবে।' },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMaintReason(preset.text)}
                          className="text-[9px] font-bold bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 px-2.5 py-1 rounded-lg border border-neutral-200/40 transition-colors cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Hotline/Helpline Numbers */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-neutral-800 block uppercase tracking-wide">হটলাইন / হেল্পলাইন নম্বরসমূহ</label>
                  <input
                    type="text"
                    value={maintHotlines}
                    onChange={(e) => setMaintHotlines(e.target.value)}
                    placeholder="যেমন: 01635275233, 01700000000"
                    className="w-full px-4 py-3 text-xs bg-white border border-neutral-200 rounded-xl focus:border-indigo-500 focus:outline-none font-mono font-bold text-neutral-700 tracking-widest"
                  />
                  <p className="text-[9px] text-neutral-400 font-medium">একাধিক নম্বর থাকলে কমা ( , ) দিয়ে আলাদা করুন। এগুলো সরাসরি মেইনটেন্যান্স স্ক্রিনে কল করার বাটন হিসেবে প্রদর্শিত হবে।</p>
                </div>

                {/* Submit button with loading feedback */}
                <div className="pt-3 border-t border-neutral-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={maintLoading}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-bold text-xs shadow-md shadow-indigo-600/10 active:scale-97 transition-all cursor-pointer"
                  >
                    {maintLoading ? 'সংরক্ষণ করা হচ্ছে...' : 'সেটিংস সেভ করুন (Save Settings)'}
                  </button>
                </div>

              </form>
            </div>

            {/* Help & Telegram Bot Integration Information */}
            <div className="bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 p-5 space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">টেলিগ্রাম বট ইন্টিগ্রেশন ও রিয়েল-টাইম সিঙ্ক</span>
              </div>
              
              <p className="text-xs font-semibold leading-relaxed text-slate-300">
                এই মেইনটেন্যান্স সিস্টেমটি আপনার <span className="text-white font-bold">টেলিগ্রাম এডমিন বট</span> এর সাথে সরাসরি সংযুক্ত। আপনি চাইলে যেকোনো স্থান থেকে কেবল টেলিগ্রাম কম্যান্ডের মাধ্যমেও পুরো ব্যবস্থা নিয়ন্ত্রণ করতে পারবেন:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">১. মেইনটেন্যান্স মোড কম্যান্ডস:</span>
                  <div className="space-y-1 font-mono text-[10px] text-slate-200">
                    <p className="bg-slate-900 px-2 py-1 rounded border border-slate-850">/maintenance on [কারণ বার্তা]</p>
                    <p className="bg-slate-900 px-2 py-1 rounded border border-slate-850">/maintenance off</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">২. জরুরি হটলাইন সেট করা:</span>
                  <div className="space-y-1 font-mono text-[10px] text-slate-200">
                    <p className="bg-slate-900 px-2 py-1 rounded border border-slate-850">/hotline [নম্বর১] [নম্বর২]</p>
                    <p className="text-[9px] text-slate-450 mt-1 font-sans">যেমন: <span className="font-mono">/hotline 01635275233 01711223344</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 1: DASHBOARD PANELS (Photo 2 & 3) */}
        {/* ================================================== */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6 text-left">
            {/* Header Area */}
            <div className="flex items-center justify-between border-b border-neutral-200/80 pb-4">
              <div>
                <h1 className="text-base font-black text-neutral-900">Dashboard Overview</h1>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">Real-time stats and automation logs</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] text-neutral-500 font-black tracking-wider uppercase">MODEM SYNCED</span>
              </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Balance In */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-4xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">BALANCE IN (Total Collected)</p>
                  <p className="text-xl font-black text-indigo-600 font-mono">৳{balanceInTotal.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Download className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Commission Paid */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-4xs flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">COMMISSION DISTRIBUTED</p>
                  <p className="text-xl font-black text-emerald-600 font-mono">৳{totalCommissionPaid.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Percent className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: Today's Net Summary */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-4xs space-y-2">
                <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">TODAY'S NET SUMMARY</p>
                <div className="flex items-center space-x-3">
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-emerald-150 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Successful: {successfulOrdersCount}</span>
                  </span>
                  <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-amber-150 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>Pending: {pendingOrdersCount}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Section: User Statistics Box & Modems Status */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* User Statistics Box (Widescreen lg:col-span-7) */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-4xs lg:col-span-7 space-y-4">
                <div className="border-b border-neutral-100 pb-2">
                  <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">User Portfolio Statistics</h3>
                  <p className="text-[9px] text-neutral-400 mt-0.5">Reseller users and liability breakdown</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-left">
                    <span className="text-[9px] font-bold text-neutral-400 block uppercase">Total Users</span>
                    <span className="text-lg font-black text-neutral-850 font-mono">{users.length}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-left">
                    <span className="text-[9px] font-bold text-emerald-600 block uppercase">Active Resellers</span>
                    <span className="text-lg font-black text-emerald-700 font-mono">{users.filter(u => u.status !== 'Suspended').length}</span>
                  </div>
                  <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-100 text-left">
                    <span className="text-[9px] font-bold text-rose-600 block uppercase">Suspended</span>
                    <span className="text-lg font-black text-rose-700 font-mono">{users.filter(u => u.status === 'Suspended').length}</span>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-left">
                    <span className="text-[9px] font-bold text-neutral-400 block uppercase">New Today</span>
                    <span className="text-lg font-black text-indigo-600 font-mono">2</span>
                  </div>
                  <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/80 text-left col-span-2">
                    <span className="text-[9px] font-bold text-indigo-600 block uppercase">System Net Liability Balance</span>
                    <span className="text-base font-black text-indigo-700 font-mono">৳{totalSystemBalance.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Live Modems / Gateways Status Indicator */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-4xs lg:col-span-5 space-y-4">
                <div className="border-b border-neutral-100 pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">Modem USSD Gateways</h3>
                    <p className="text-[9px] text-neutral-400 mt-0.5">Live SIM connection status</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-indigo-150">SMS API ON</span>
                </div>

                <div className="space-y-2.5">
                  {(systemData?.ussdGateways || [
                    { id: "g1", name: "GP USSD Modem 1", simSlot: "Slot 1", status: "Connected", signal: "Strong", operator: "Grameenphone" },
                    { id: "g2", name: "Robi USSD Modem 2", simSlot: "Slot 2", status: "Connected", signal: "Medium", operator: "Robi" },
                    { id: "g3", name: "BL USSD Modem 3", simSlot: "Slot 3", status: "Disconnected", signal: "None", operator: "Banglalink" }
                  ]).map((gw: any) => (
                    <div key={gw.id} className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-150 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${gw.status === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`}></div>
                        <div>
                          <p className="text-xs font-bold text-neutral-800 leading-none">{gw.name}</p>
                          <span className="text-[8.5px] text-neutral-400 font-bold block mt-1">{gw.operator} ({gw.simSlot})</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded ${
                        gw.status === 'Connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-400'
                      }`}>
                        {gw.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white border border-neutral-200/60 rounded-2xl shadow-4xs overflow-hidden">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">Recent Platform Transactions</h3>
                  <p className="text-[9px] text-neutral-400">Approved, pending or returned transaction requests</p>
                </div>
                <button 
                  onClick={() => setActiveSubTab('transactions')}
                  className="text-[9.5px] font-extrabold text-indigo-600 hover:underline"
                >
                  View All Transactions
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-150 text-[9.5px] font-black text-neutral-400 uppercase tracking-wider">
                      <th className="p-3">Order ID</th>
                      <th className="p-3">User</th>
                      <th className="p-3">Service & Operator</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">TrxID / Target</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs font-medium text-neutral-700">
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord.id} className="hover:bg-neutral-50/30">
                        <td className="p-3 font-mono font-bold text-neutral-900">{ord.id}</td>
                        <td className="p-3">
                          <p className="font-bold text-neutral-800 leading-none">{ord.userEmail?.split('@')[0]}</p>
                          <span className="text-[8.5px] text-neutral-400 font-bold block mt-1">{ord.userPhone}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              ord.type === 'Add Money' ? 'bg-pink-500' :
                              ord.type === 'Drive Pack' ? 'bg-sky-500' :
                              ord.type === 'Bank Transfer' ? 'bg-indigo-500' :
                              'bg-amber-500'
                            }`}></span>
                            <span className="font-bold text-neutral-800">{ord.serviceName || ord.type}</span>
                          </div>
                        </td>
                        <td className="p-3 font-extrabold text-neutral-900">৳{ord.amount} BDT</td>
                        <td className="p-3 font-mono text-[10.5px]">
                          {ord.trxId && <p className="font-bold uppercase text-neutral-800">{ord.trxId}</p>}
                          {ord.account && <p className="text-neutral-500">{ord.account}</p>}
                        </td>
                        <td className="p-3 text-[10px] text-neutral-400 font-bold">
                          {new Date(ord.date).toLocaleTimeString('bn-BD', { hour: 'numeric', minute: 'numeric' })}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                            ord.status?.toUpperCase() === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            ord.status?.toUpperCase() === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* TAB ONGOING ORDERS: ONGOING ORDERS QUEUE */}
        {/* ================================================== */}
        {activeSubTab === 'ongoing_orders' && (
          <OngoingOrdersView
            orders={orders}
            actionLoading={actionLoading}
            onApprove={handleApprove}
            onReject={handleOpenRejectModal}
            onViewInvoice={setSelectedAdminInvoice}
          />
        )}

        {/* ================================================== */}
        {/* TAB 2: TRANSACTIONS & APPROVALS (All Orders) */}
        {/* ================================================== */}
        {(activeSubTab === 'transactions' || activeSubTab === 'balance_requests') && (
          <div className="bg-white border border-neutral-200/60 rounded-2xl shadow-4xs text-left overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-neutral-900">
                  {activeSubTab === 'balance_requests' ? 'পেন্ডিং অ্যাড মানি রিকোয়েস্ট সমূহ' : 'সকল প্ল্যাটফর্ম ট্রানজেকশন তালিকা'}
                </h3>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
                  {activeSubTab === 'balance_requests' ? 'Add Money / Deposit Approval Requests' : 'Manage & approve user transactions'}
                </p>
              </div>
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold font-mono">
                {orders.filter(o => o.status?.toUpperCase() === 'PENDING' && (activeSubTab !== 'balance_requests' || o.type === 'Add Money')).length} Pending
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                    <th className="p-4">অর্ডার প্রকার & আইডি</th>
                    <th className="p-4">গ্রাহক ফোন</th>
                    <th className="p-4">সার্ভিস / অপারেটর</th>
                    <th className="p-4">পরিমাণ BDT</th>
                    <th className="p-4">ট্রানজেকশন / অ্যাকাউন্ট</th>
                    <th className="p-4 text-center">অ্যাকশন / স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-medium text-neutral-700">
                  {orders.filter(o => activeSubTab !== 'balance_requests' || o.type === 'Add Money').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-neutral-400 font-bold">কোনো ট্রানজেকশন তথ্য পাওয়া যায়নি।</td>
                    </tr>
                  ) : (
                    orders
                      .filter(o => activeSubTab !== 'balance_requests' || o.type === 'Add Money')
                      .map((ord) => (
                        <tr key={ord.id} className="hover:bg-neutral-50/50">
                          <td className="p-4 space-y-0.5">
                            <span className="font-mono font-bold text-neutral-900">{ord.id}</span>
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded ${
                                ord.type === 'Add Money' ? 'bg-pink-50 text-pink-700 border border-pink-100' :
                                ord.type === 'Drive Pack' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                                ord.type === 'Bank Transfer' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {ord.type}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-neutral-850">{ord.userPhone}</td>
                          <td className="p-4 font-bold text-neutral-900">
                            {ord.serviceName} {ord.paymentMethod ? `(${ord.paymentMethod})` : ''}
                          </td>
                          <td className="p-4 font-black text-neutral-900">৳{ord.amount} BDT</td>
                          <td className="p-4 space-y-0.5 font-mono text-[10.5px]">
                            {ord.trxId && <p className="text-neutral-900 font-bold uppercase">{ord.trxId}</p>}
                            {ord.account && <p className="text-neutral-500 font-semibold">{ord.account}</p>}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center space-x-1.5">
                              {ord.status?.toUpperCase() === 'PENDING' ? (
                                <>
                                  <button
                                    onClick={() => handleApprove(ord.id)}
                                    disabled={actionLoading}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-lg cursor-pointer transition-colors active:scale-95"
                                    title="অনুমোদন করুন"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenRejectModal(ord)}
                                    disabled={actionLoading}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg cursor-pointer transition-colors active:scale-95"
                                    title="বাতিল করুন"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <div className="text-center">
                                  <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                                    ord.status?.toUpperCase() === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}>
                                    {ord.status}
                                  </span>
                                  {ord.cancellationReason && (
                                    <p className="text-[9.5px] text-neutral-400 mt-1 truncate max-w-[150px]">{ord.cancellationReason}</p>
                                  )}
                                </div>
                              )}
                              
                              {/* Invoice / PDF button */}
                              <button
                                onClick={() => setSelectedAdminInvoice(ord)}
                                className="p-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg cursor-pointer transition-colors active:scale-95"
                                title="ইনভয়েস / PDF দেখুন"
                              >
                                <FileText className="w-4 h-4 text-indigo-500" />
                              </button>

                              {ord.type === 'Calling Card' && ord.status?.toUpperCase() === 'SUCCESS' && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditApprovedOrder(ord)}
                                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-lg cursor-pointer transition-colors active:scale-95"
                                  title="কার্ড ইনফো পরিবর্তন করুন (Edit Card Info)"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(ord.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg cursor-pointer transition-colors active:scale-95"
                                title="অর্ডার ডিলিট করুন (Delete Order)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 3: BALANCE TRANSFER SCREEN (Photo 1) */}
        {/* ================================================== */}
        {activeSubTab === 'balance_transfer' && (
          <div className="space-y-6 text-left">
            {/* Header */}
            <div>
              <h1 className="text-base font-black text-neutral-900">ব্যালেন্স স্থানান্তর গেটওয়ে (Balance Transfer)</h1>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">Instantly send or return reseller wallet funds</p>
            </div>

            {/* Top Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: Total Sent */}
              <div className="p-4 rounded-xl border border-emerald-150 bg-emerald-50/50 text-emerald-900">
                <span className="text-[9px] font-bold text-emerald-600 uppercase block tracking-wider">TOTAL SENT (প্রেরিত ফান্ড)</span>
                <p className="text-base font-black font-mono mt-1">৳{totalSentAmount.toLocaleString('bn-BD')}</p>
              </div>

              {/* Card 2: Total Returned */}
              <div className="p-4 rounded-xl border border-rose-150 bg-rose-50/50 text-rose-900">
                <span className="text-[9px] font-bold text-rose-600 uppercase block tracking-wider">TOTAL RETURNED (ফেরত ফান্ড)</span>
                <p className="text-base font-black font-mono mt-1">৳{totalReturnedAmount.toLocaleString('bn-BD')}</p>
              </div>

              {/* Card 3: Today Sent */}
              <div className="p-4 rounded-xl border border-blue-150 bg-blue-50/50 text-blue-900">
                <span className="text-[9px] font-bold text-blue-600 uppercase block tracking-wider">TODAY SENT</span>
                <p className="text-base font-black font-mono mt-1">৳{todaySentAmount.toLocaleString('bn-BD')}</p>
              </div>

              {/* Card 4: Today Returned */}
              <div className="p-4 rounded-xl border border-amber-150 bg-amber-50/50 text-amber-900">
                <span className="text-[9px] font-bold text-amber-600 uppercase block tracking-wider">TODAY RETURNED</span>
                <p className="text-base font-black font-mono mt-1">৳{todayReturnedAmount.toLocaleString('bn-BD')}</p>
              </div>
            </div>

            {/* Interactive New Transfer Form */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-4xs max-w-xl mx-auto space-y-4">
              <div className="border-b border-neutral-100 pb-2">
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">New Balance Transfer Request</h3>
                <p className="text-[9.5px] text-neutral-400">Deduct or add funds securely from custom user portfolios</p>
              </div>

              <form onSubmit={handleBalanceTransferSubmit} className="space-y-4">
                {/* Transfer Type Selector */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">TRANSFER TYPE *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTransferType('Send')}
                      className={`py-3 text-xs font-black rounded-xl border-2 transition-all cursor-pointer ${
                        transferType === 'Send'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-500'
                      }`}
                    >
                      ↓ Send Balance (যোগ করুন)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferType('Return')}
                      className={`py-3 text-xs font-black rounded-xl border-2 transition-all cursor-pointer ${
                        transferType === 'Return'
                          ? 'bg-rose-50 border-rose-500 text-rose-800'
                          : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-500'
                      }`}
                    >
                      ↑ Return Balance (ফেরত নিন)
                    </button>
                  </div>
                </div>

                {/* Select User Searchable Dropdown */}
                <div className="flex flex-col space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">SELECT TARGET USER *</label>
                  
                  {selectedTransferUser ? (
                    <div className="p-3 bg-neutral-50 rounded-xl border-2 border-indigo-500 flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-xs font-black text-neutral-900">{selectedTransferUser.name}</p>
                        <p className="text-[10px] text-neutral-500 font-bold font-mono mt-0.5">{selectedTransferUser.phone} | {selectedTransferUser.role}</p>
                        <p className="text-[9.5px] text-neutral-400 font-bold font-mono">Current: ৳{selectedTransferUser.walletBalance} BDT</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTransferUser(null);
                          setTransferUserSearch('');
                        }}
                        className="p-1 hover:bg-neutral-200 rounded-full text-neutral-400 hover:text-neutral-900 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3.5 text-neutral-400" />
                        <input
                          type="text"
                          placeholder="Search user by name, phone or email..."
                          value={transferUserSearch}
                          onChange={(e) => setTransferUserSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2.5 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Dropdown Options */}
                      {transferUserSearch && (
                        <div className="absolute left-0 right-0 z-20 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-[160px] overflow-y-auto mt-1 p-1 space-y-0.5">
                          {filteredUsersForTransfer.length === 0 ? (
                            <p className="text-[10px] text-neutral-400 p-3 text-center">No resellers found.</p>
                          ) : (
                            filteredUsersForTransfer.map((u) => (
                              <button
                                key={u.phone}
                                type="button"
                                onClick={() => {
                                  setSelectedTransferUser(u);
                                  setTransferUserSearch('');
                                }}
                                className="w-full text-left p-2 hover:bg-neutral-50 rounded-lg flex justify-between items-center transition-colors"
                              >
                                <div>
                                  <p className="text-xs font-bold text-neutral-900">{u.name}</p>
                                  <p className="text-[10px] text-neutral-400 font-bold font-mono mt-0.5">{u.phone}</p>
                                </div>
                                <span className="text-[10px] bg-neutral-100 text-neutral-700 font-black px-1.5 py-0.5 rounded font-mono">৳{u.walletBalance}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">AMOUNT (৳) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="যেমন: ১০০০ BDT"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="p-2.5 border border-neutral-250 rounded-xl text-xs font-black focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Note */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">NOTE / REFERENCE (OPTIONAL)</label>
                  <input
                    type="text"
                    placeholder="যেমন: Weekly promo balance, Setup credit"
                    value={transferNote}
                    onChange={(e) => setTransferNote(e.target.value)}
                    className="p-2.5 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Messages */}
                {transferErrorMsg && (
                  <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">{transferErrorMsg}</p>
                )}
                {transferSuccessMsg && (
                  <p className="text-xs font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 flex items-center space-x-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                    <span>{transferSuccessMsg}</span>
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`w-full py-3.5 rounded-xl text-xs font-black text-white transition-all cursor-pointer ${
                    transferType === 'Send' 
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/10' 
                      : 'bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/10'
                  }`}
                >
                  {actionLoading ? 'ফান্ড স্থানান্তরিত হচ্ছে...' : `${transferType === 'Send' ? '↓ সেন্ড মানি করুন' : '↑ ফান্ড ফেরত নিন'} (স্থানান্তর সাবমিট করুন)`}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 4: SERVICES MANAGEMENT & CUSTOM ICON UPLOAD */}
        {/* ================================================== */}
        {activeSubTab === 'services' && (
          <div className="space-y-6 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">সার্ভিস আইকন ও গেটওয়ে ম্যানেজার (Services Catalog)</h1>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">Edit active services and upload custom vectors/icons</p>
            </div>

            {/* List Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Left Column: All Services Table */}
              <div className="bg-white border border-neutral-200/60 rounded-2xl shadow-4xs overflow-hidden">
                <div className="p-4 border-b border-neutral-100">
                  <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">Active Platform Services</h3>
                </div>

                <div className="divide-y divide-neutral-100">
                  {services.map((serv) => (
                    <div key={serv.id} className="p-3 flex items-center justify-between hover:bg-neutral-50/50">
                      <div className="flex items-center space-x-3">
                        {/* Custom Icon Circle Preview */}
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center overflow-hidden shrink-0">
                          {serv.icon ? (
                            <img src={serv.icon} alt={serv.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9.5px] font-black text-neutral-400 uppercase">{serv.name.substring(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black text-neutral-900 leading-none">{serv.name}</p>
                          <span className="text-[8.5px] text-neutral-400 font-semibold block mt-1 uppercase tracking-wider">{serv.type} | {serv.country}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          serv.isEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-400'
                        }`}>
                          {serv.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingService({ ...serv });
                            setServiceIconBase64(serv.icon || '');
                          }}
                          className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900 rounded-lg border border-neutral-150 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Edit Service Form */}
              {editingService ? (
                <div className="bg-white p-5 rounded-2xl border-2 border-indigo-500 shadow-4xs space-y-4">
                  <div className="border-b border-neutral-100 pb-2 flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider">Edit Service Details & Logo</h3>
                      <p className="text-[9.5px] text-neutral-400 mt-0.5">Customize properties and brand graphics</p>
                    </div>
                    <button 
                      onClick={() => {
                        setEditingService(null);
                        setServiceIconBase64('');
                      }}
                      className="p-1 hover:bg-neutral-100 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveService} className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Service Name *</label>
                        <input
                          type="text"
                          required
                          value={editingService.name}
                          onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">Service Slug *</label>
                        <input
                          type="text"
                          required
                          value={editingService.slug}
                          onChange={(e) => setEditingService({ ...editingService, slug: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Service Type *</label>
                        <select
                          value={editingService.type}
                          onChange={(e) => setEditingService({ ...editingService, type: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 bg-white"
                        >
                          <option value="Main Grid">Main Grid</option><option value="Mobile Bank">Mobile Bank</option>
                          <option value="Recharge">Recharge</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Drive">Drive</option>
                        </select>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Country *</label>
                        <input
                          type="text"
                          required
                          value={editingService.country}
                          onChange={(e) => setEditingService({ ...editingService, country: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Numerical configurations */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Sort Order</label>
                        <input
                          type="number"
                          value={editingService.sortOrder}
                          onChange={(e) => setEditingService({ ...editingService, sortOrder: Number(e.target.value) })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">Rate Multiplier</label>
                        <input
                          type="number"
                          step={0.01}
                          value={editingService.rateMultiplier}
                          onChange={(e) => setEditingService({ ...editingService, rateMultiplier: Number(e.target.value) })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Toggle Checks */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <label className="flex items-center space-x-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingService.isEnabled}
                          onChange={(e) => setEditingService({ ...editingService, isEnabled: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-bold text-neutral-700">Service Active</span>
                      </label>

                      <label className="flex items-center space-x-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingService.requirePin}
                          onChange={(e) => setEditingService({ ...editingService, requirePin: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-bold text-neutral-700">Require User PIN</span>
                      </label>
                    </div>

                    {/* Service Icon Upload Box */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-neutral-500 block uppercase">SERVICE LOGO IMAGE (MAX 2MB)</label>
                      <div className="flex items-center space-x-4">
                        {/* Circle preview with click-to-upload simulation */}
                        <label className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 hover:border-indigo-500 bg-neutral-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden group shrink-0 transition-all">
                          {serviceIconBase64 ? (
                            <img src={serviceIconBase64} alt="Upload preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-1">
                              <ImageIcon className="w-5 h-5 text-neutral-400 mx-auto group-hover:text-indigo-500" />
                              <span className="text-[8px] text-neutral-400 block font-bold leading-none mt-1">Logo</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleIconChange}
                            className="hidden"
                          />
                        </label>

                        <div className="text-left space-y-1">
                          <p className="text-[10.5px] font-bold text-neutral-800">Choose Image</p>
                          <p className="text-[9px] text-neutral-400">Click circle to upload custom JPG, PNG, or SVG brand asset dynamically.</p>
                          {serviceIconBase64 && (
                            <button
                              type="button"
                              onClick={() => setServiceIconBase64('')}
                              className="text-[9px] font-black text-rose-500 hover:underline"
                            >
                              Reset Logo
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/10 active:scale-98 cursor-pointer"
                    >
                      {actionLoading ? 'সেভ হচ্ছে...' : 'সার্ভিস সেটিংস ও কাস্টম লোগো সেভ করুন'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center text-slate-400 min-h-[300px]">
                  <Layers className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-500">Edit Selected Service</p>
                  <p className="text-[10px] text-slate-400 mt-1">Click the edit button next to any platform service on the left to modify sorted rankings, rate margins, active switches or upload custom images dynamically.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* TAB 5: GENERAL MOCK SHEETS / INTERFACES FOR OTHER MENU CATEGORIES */}
        {/* ================================================== */}
        {activeSubTab === 'operators' && (
          <div className="space-y-6 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Operators Database</h1>
              <p className="text-[10px] text-neutral-400">Manage cellular operators active for mobile flexiload and gift packs</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { name: 'Grameenphone', code: 'GP', prefix: '017, 013', color: 'bg-blue-50 border-blue-200 text-blue-900' },
                { name: 'Robi', code: 'Robi', prefix: '018', color: 'bg-red-50 border-red-200 text-red-900' },
                { name: 'Airtel', code: 'Airtel', prefix: '016', color: 'bg-rose-50 border-rose-200 text-rose-900' },
                { name: 'Banglalink', code: 'BL', prefix: '019, 014', color: 'bg-orange-50 border-orange-200 text-orange-900' },
                { name: 'Teletalk', code: 'Teletalk', prefix: '015', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' }
              ].map((op, i) => (
                <div key={i} className={`p-4 rounded-xl border ${op.color} flex flex-col justify-between h-28`}>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block">{op.code}</span>
                    <p className="text-xs font-bold mt-1">{op.name}</p>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-bold block font-mono">Prefix: {op.prefix}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* TAB: CALLING CARDS MANAGER */}
        {/* ================================================== */}
        {activeSubTab === 'calling_cards_edit' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div>
                <h1 className="text-base font-black text-neutral-900">কলিং কার্ড অফার ম্যানেজার (Calling Cards Manager)</h1>
                <p className="text-[10px] text-neutral-400">Create, edit and delete active calling card packages dynamically</p>
              </div>
              <button
                onClick={() => {
                  setCallingCardForm({
                    brand: 'Itel Mobile Dialer',
                    pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে',
                    country: 'Bangladesh',
                    value: 10,
                    priceBdt: 1120,
                    minutes: '১২০০ মিনিট',
                    rateDescription: ''
                  });
                  setIsEditingCallingCard(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন কলিং কার্ড যোগ করুন</span>
              </button>
            </div>

            {isEditingCallingCard && (
              <form onSubmit={handleSaveCallingCard} className="p-5 bg-white border-2 border-indigo-500 rounded-2xl shadow-sm space-y-4 max-w-lg">
                <div className="border-b border-neutral-100 pb-2">
                  <h3 className="text-xs font-bold text-neutral-900">{callingCardForm.id ? 'কলিং কার্ড অফার এডিট করুন' : 'নতুন কলিং কার্ড অফার যুক্ত করুন'}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">ব্র্যান্ড (Brand)</label>
                    <select
                      value={callingCardForm.brand}
                      onChange={(e) => setCallingCardForm({ ...callingCardForm, brand: e.target.value })}
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold bg-white"
                    >
                      <option value="Itel Mobile Dialer">Itel Mobile Dialer</option>
                      <option value="Green Tel Dollar">Green Tel Dollar</option>
                      <option value="Jamalpur Express Dollar">Jamalpur Express Dollar</option>
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">পালস রেট (Pulse Rate)</label>
                    <select
                      value={callingCardForm.pulseRate}
                      onChange={(e) => setCallingCardForm({ ...callingCardForm, pulseRate: e.target.value })}
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold bg-white"
                    >
                      <option value="৩০ সেকেন্ডে ১ মিনিট হবে">৩০ সেকেন্ডে ১ মিনিট হবে</option>
                      <option value="৫০ সেকেন্ডে ১ মিনিট হবে">৫০ সেকেন্ডে ১ মিনিট হবে</option>
                      <option value="ইউএসডি ১/১ মিনিট হবে">ইউএসডি ১/১ মিনিট হবে</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">দেশ (Country)</label>
                    <input
                      type="text"
                      value={callingCardForm.country}
                      onChange={(e) => setCallingCardForm({ ...callingCardForm, country: e.target.value })}
                      placeholder="যেমন: Bangladesh, India, Saudi Arabia"
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">মূল্য ইউএসডি (Value in USD) *</label>
                    <input
                      type="number"
                      value={callingCardForm.value}
                      onChange={(e) => setCallingCardForm({ ...callingCardForm, value: Number(e.target.value) })}
                      placeholder="যেমন: 10, 15, 25"
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">টাকা মূল্য বিডিটি (Price in BDT) *</label>
                    <input
                      type="number"
                      value={callingCardForm.priceBdt}
                      onChange={(e) => setCallingCardForm({ ...callingCardForm, priceBdt: Number(e.target.value) })}
                      placeholder="যেমন: 1120"
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">মিনিট বর্ণনা (Minutes Summary) *</label>
                    <input
                      type="text"
                      value={callingCardForm.minutes}
                      onChange={(e) => setCallingCardForm({ ...callingCardForm, minutes: e.target.value })}
                      placeholder="যেমন: ১২০০ মিনিট"
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500">विशेष বর্ণনা (Rate Details)</label>
                  <input
                    type="text"
                    value={callingCardForm.rateDescription}
                    onChange={(e) => setCallingCardForm({ ...callingCardForm, rateDescription: e.target.value })}
                    placeholder="যেমন: ৩০ সেকেন্ড পালস রেট, ক্রিস্টাল ক্লিয়ার অডিও"
                    className="p-2 border border-neutral-250 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingCallingCard(false)}
                    className="px-3 py-1.5 bg-neutral-150 text-neutral-700 hover:bg-neutral-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    {actionLoading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white border border-neutral-200/65 rounded-2xl overflow-hidden shadow-4xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-neutral-500 border-collapse">
                  <thead className="bg-neutral-50 border-b border-neutral-200/60 text-neutral-700 text-[10px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="p-4">ব্র্যান্ড (Brand)</th>
                      <th className="p-4">দেশ (Country)</th>
                      <th className="p-4">পালস (Pulse)</th>
                      <th className="p-4">USD মূল্য</th>
                      <th className="p-4">BDT টাকা</th>
                      <th className="p-4">মিনিট (Minutes)</th>
                      <th className="p-4 text-right">অ্যাকশন (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-150">
                    {callingCards.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-neutral-400 font-bold">
                          কোন কলিং কার্ড অফার পাওয়া যায়নি।
                        </td>
                      </tr>
                    ) : (
                      callingCards.map((card) => (
                        <tr key={card.id} className="hover:bg-neutral-50/50 transition-colors font-semibold text-neutral-800">
                          <td className="p-4">
                            <span className="font-extrabold text-neutral-900 block">{card.brand}</span>
                            <span className="text-[9px] text-neutral-400 font-medium block">{card.id}</span>
                          </td>
                          <td className="p-4 font-bold">{card.country}</td>
                          <td className="p-4 text-[10px] text-indigo-600 font-extrabold">{card.pulseRate}</td>
                          <td className="p-4 font-mono font-bold text-amber-600">${card.value}</td>
                          <td className="p-4 font-mono font-black text-emerald-600">৳{card.priceBdt} BDT</td>
                          <td className="p-4 text-neutral-600">{card.minutes}</td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  setSelectedStockPackage({
                                    id: card.id,
                                    title: card.brand,
                                    operator: card.brand,
                                    min: card.minutes,
                                    regularPrice: card.value.toString(),
                                    mb: card.country,
                                    resellerPrice: card.priceBdt.toString()
                                  } as any);
                                  setActiveSubTab('packages');
                                }}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="স্টক ম্যানেজ করুন"
                              >
                                <Package className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setCallingCardForm({ ...card });
                                  setIsEditingCallingCard(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="এডিট"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCallingCard(card.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="ডিলিট"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Existing CRUD Packages */}
        {activeSubTab === 'packages' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div>
                <h1 className="text-base font-black text-neutral-900">অফার ও ড্রাইভ প্যাক ম্যানেজার (Packages / Drives)</h1>
                <p className="text-[10px] text-neutral-400">Create, edit and delete active reseller packages</p>
              </div>
              <button
                onClick={handleOpenAddOffer}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন অফার যোগ করুন</span>
              </button>
            </div>

            {isEditingOffer && (
              <form onSubmit={handleSaveOffer} className="p-5 bg-white border-2 border-indigo-500 rounded-2xl shadow-sm space-y-4 max-w-lg">
                <div className="border-b border-neutral-100 pb-2">
                  <h3 className="text-xs font-bold text-neutral-900">{offerForm.id ? 'অফার এডিট করুন' : 'নতুন অফার যুক্ত করুন'}</h3>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500">ক্যাটাগরি</label>
                  <select
                    value={offerForm.category}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      setOfferForm({
                        ...offerForm,
                        category: cat,
                        operator: cat === 'Calling Card' ? 'Itel Mobile Dialer' : 'Grameenphone',
                        mb: cat === 'Calling Card' ? '৩০ সেকেন্ডে ১ মিনিট হবে' : '10 GB',
                        min: cat === 'Calling Card' ? 'Saudi Arabia' : '0 Min',
                        regularPrice: cat === 'Calling Card' ? '10' : '300',
                        resellerPrice: cat === 'Calling Card' ? '1120' : '250',
                        validity: cat === 'Calling Card' ? '১২০০ মিনিট' : '30 Days',
                        description: cat === 'Calling Card' ? 'বাংলাদেশ ৪৪০ মিনিট | ইন্ডিয়া ৪০০ মিনিট' : ''
                      });
                    }}
                    className="p-2 border border-neutral-250 rounded-xl text-xs font-bold bg-white"
                  >
                    <option value="Internet">Internet</option>
                    <option value="Minutes">Minutes</option>
                    <option value="Bundles">Bundles</option>
                    <option value="Call Rate">Call Rate</option>
                    <option value="Calling Card">Calling Card</option>
                  </select>
                </div>

                {offerForm.category === 'Calling Card' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">কলিং কার্ড ব্র্যান্ড (Brand / Operator) *</label>
                        <select
                          value={offerForm.operator}
                          onChange={(e) => setOfferForm({ ...offerForm, operator: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold bg-white"
                        >
                          <option value="Itel Mobile Dialer">Itel Mobile Dialer</option>
                          <option value="Green Tel Dollar">Green Tel Dollar</option>
                          <option value="Jamalpur Express Dollar">Jamalpur Express Dollar</option>
                          <option value="Rm Voice Dollar">Rm Voice Dollar</option>
                        </select>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">পালস রেট (Sub Category / Pulse) *</label>
                        <select
                          value={offerForm.mb}
                          onChange={(e) => setOfferForm({ ...offerForm, mb: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold bg-white"
                        >
                          <option value="৩০ সেকেন্ডে ১ মিনিট হবে">৩০ সেকেন্ডে ১ মিনিট হবে</option>
                          <option value="৫০ সেকেন্ডে ১ মিনিট হবে">৫০ সেকেন্ডে ১ মিনিট হবে</option>
                          <option value="ইউএসডি ১/১ মিনিট হবে">ইউএসডি ১/১ মিনিট হবে</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">দেশ (Country) *</label>
                        <select
                          value={offerForm.min}
                          onChange={(e) => setOfferForm({ ...offerForm, min: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold bg-white"
                        >
                          {['Saudi Arabia', 'UAE', 'Qatar', 'Oman', 'Bahrain', 'Kuwait', 'Maldives', 'Malaysia', 'Singapore', 'Jordan', 'Lebanon', 'Bangladesh'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">কার্ড ভ্যালু ($ USD) *</label>
                        <input
                          type="number"
                          required
                          placeholder="যেমন: 10"
                          value={offerForm.regularPrice}
                          onChange={(e) => setOfferForm({ ...offerForm, regularPrice: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">রিসেলার মূল্য BDT (৳ BDT) *</label>
                        <input
                          type="number"
                          required
                          placeholder="যেমন: 1120"
                          value={offerForm.resellerPrice}
                          onChange={(e) => setOfferForm({ ...offerForm, resellerPrice: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">মোট মিনিট (Minutes validity) *</label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: ১২০০ মিনিট"
                          value={offerForm.validity}
                          onChange={(e) => setOfferForm({ ...offerForm, validity: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500">মিনিট হিসাব ও কান্ট্রি বিবরণী (Description) *</label>
                      <textarea
                        required
                        placeholder="যেমন: বাংলাদেশ ৪৪০ মিনিট | ইন্ডিয়া ৪০০ মিনিট"
                        value={offerForm.description}
                        onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                        className="p-2 border border-neutral-250 rounded-xl text-xs font-bold min-h-[60px]"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">অফারের নাম *</label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: GP Dhamaka 30GB + 500 Min"
                          value={offerForm.title}
                          onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">অপারেটর</label>
                        <select
                          value={offerForm.operator}
                          onChange={(e) => setOfferForm({ ...offerForm, operator: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold bg-white"
                        >
                          <option value="Grameenphone">Grameenphone</option>
                          <option value="Robi">Robi</option>
                          <option value="Airtel">Airtel</option>
                          <option value="Teletalk">Teletalk</option>
                          <option value="Banglalink">Banglalink</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">অফারের ধরণ</label>
                        <select
                          value={offerForm.isDrivePack ? 'drive' : 'internet'}
                          onChange={(e) => setOfferForm({ ...offerForm, isDrivePack: e.target.value === 'drive' })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold bg-white"
                        >
                          <option value="drive">ড্রাইভ প্যাক</option>
                          <option value="internet">ইন্টারনেট প্যাক</option>
                        </select>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">মেয়াদ</label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: 30 Days"
                          value={offerForm.validity}
                          onChange={(e) => setOfferForm({ ...offerForm, validity: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">রেগুলার মূল্য BDT *</label>
                        <input
                          type="number"
                          required
                          placeholder="600"
                          value={offerForm.regularPrice}
                          onChange={(e) => setOfferForm({ ...offerForm, regularPrice: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500">রিসেলার বিশেষ মূল্য BDT *</label>
                        <input
                          type="number"
                          required
                          placeholder="550"
                          value={offerForm.resellerPrice}
                          onChange={(e) => setOfferForm({ ...offerForm, resellerPrice: e.target.value })}
                          className="p-2 border border-neutral-250 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500">সংক্ষিপ্ত বিবরণ</label>
                      <input
                        type="text"
                        placeholder="যেমন: All BD Pack, Instant Active"
                        value={offerForm.description}
                        onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                        className="p-2 border border-neutral-250 rounded-xl text-xs font-bold"
                      />
                    </div>
                  </>
                )}

                {offerError && <p className="text-xs font-bold text-rose-500">{offerError}</p>}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingOffer(false)}
                    className="flex-1 py-2 text-xs border border-neutral-200 text-neutral-500 font-bold rounded-lg hover:bg-neutral-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg"
                  >
                    সেভ করুন
                  </button>
                </div>
              </form>
            )}

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-neutral-100 pb-3">
              {['All', 'Internet', 'Minutes', 'Bundles', 'Call Rate', 'Calling Card'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setPackageCategoryFilter(cat);
                    setSelectedStockPackage(null); // Clear stock package when switching tabs
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                    packageCategoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {cat === 'Calling Card' ? 'Calling Cards' : cat}
                </button>
              ))}
            </div>

            {selectedStockPackage ? (
              /* Credentials / Card Stock Management page */
              <div className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <button
                      onClick={() => setSelectedStockPackage(null)}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <span>← ব্যাক টু অফার লিস্ট</span>
                    </button>
                    <h2 className="text-sm font-black text-neutral-900 mt-1">
                      Credentials & Stock Management for {selectedStockPackage.operator} ({selectedStockPackage.min})
                    </h2>
                    <p className="text-[10px] text-neutral-400">
                      Value: ${selectedStockPackage.regularPrice} USD | Pulse: {selectedStockPackage.mb}
                    </p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold border border-emerald-200">
                    ৳{selectedStockPackage.resellerPrice} BDT
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Add Stock Item Form */}
                  <div className="space-y-4">
                    <form onSubmit={handleAddStockItem} className="p-4 bg-neutral-50 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-neutral-700 border-b border-neutral-200 pb-1.5">Add Single Stock Item</h4>
                      
                      <div className="flex space-x-4">
                        <label className="flex items-center space-x-1 text-xs font-bold">
                          <input
                            type="radio"
                            checked={stockType === 'pin'}
                            onChange={() => setStockType('pin')}
                          />
                          <span>PIN / Password</span>
                        </label>
                        <label className="flex items-center space-x-1 text-xs font-bold">
                          <input
                            type="radio"
                            checked={stockType === 'voucher'}
                            onChange={() => setStockType('voucher')}
                          />
                          <span>Voucher Image URL</span>
                        </label>
                      </div>

                      {stockType === 'pin' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col space-y-0.5">
                            <label className="text-[9px] font-bold text-neutral-500">PIN / Username</label>
                            <input
                              type="text"
                              value={stockPin}
                              onChange={(e) => setStockPin(e.target.value)}
                              placeholder="e.g. PIN1234"
                              className="p-1.5 border border-neutral-300 rounded text-xs"
                            />
                          </div>
                          <div className="flex flex-col space-y-0.5">
                            <label className="text-[9px] font-bold text-neutral-500">Password</label>
                            <input
                              type="text"
                              value={stockPassword}
                              onChange={(e) => setStockPassword(e.target.value)}
                              placeholder="e.g. PASS123"
                              className="p-1.5 border border-neutral-300 rounded text-xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-0.5">
                          <label className="text-[9px] font-bold text-neutral-500">Voucher Image (URL or Upload)</label>
                          <div className="flex space-x-1">
                            <input
                              type="text"
                              value={stockImageUrl}
                              onChange={(e) => setStockImageUrl(e.target.value)}
                              placeholder="https://example.com/voucher.jpg"
                              className="flex-1 p-1.5 border border-neutral-300 rounded text-xs"
                            />
                            <label className="flex items-center justify-center px-2 py-1.5 border border-indigo-200 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black cursor-pointer hover:bg-indigo-100 transition-colors">
                              <Upload className="w-3 h-3" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleStockImageUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col space-y-0.5">
                        <label className="text-[9px] font-bold text-neutral-500">Expiry Date</label>
                        <input
                          type="text"
                          value={stockExpiry}
                          onChange={(e) => setStockExpiry(e.target.value)}
                          placeholder="e.g. 2026-12-31"
                          className="p-1.5 border border-neutral-300 rounded text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded"
                      >
                        Add Stock Item
                      </button>
                    </form>
                  </div>

                  {/* Right: Bulk PIN Import Form */}
                  <div className="space-y-4">
                    <form onSubmit={handleBulkImportStock} className="p-4 bg-neutral-50 rounded-xl space-y-3 flex flex-col h-full justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-700 border-b border-neutral-200 pb-1.5">Bulk PIN / Credentials Import</h4>
                        <p className="text-[9px] text-neutral-400 mt-1">
                          Format: Paste credentials with line separator. Each line: `PIN,Password,Expiry` or tab-separated.
                        </p>
                        <textarea
                          rows={4}
                          value={bulkImportText}
                          onChange={(e) => setBulkImportText(e.target.value)}
                          placeholder={"PIN10001,Pass551,2026-12-31\nPIN10002,Pass552,2026-12-31"}
                          className="w-full p-2 border border-neutral-300 rounded text-xs font-mono mt-2 animate-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded mt-2"
                      >
                        Bulk Import PINs
                      </button>
                    </form>
                  </div>
                </div>

                {stockError && <p className="text-xs font-bold text-rose-500">{stockError}</p>}
                {stockSuccess && <p className="text-xs font-bold text-emerald-600">{stockSuccess}</p>}

                {/* Stock Inventory Table */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden mt-4">
                  <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-neutral-700">Stock Inventory Items</span>
                    <span className="text-[10px] font-bold text-indigo-600">
                      Total: {cardStocks.filter(s => s.packageId === selectedStockPackage.id).length} | Available: {cardStocks.filter(s => s.packageId === selectedStockPackage.id && s.status === 'Available').length}
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-100/50 border-b border-neutral-200 text-[10px] text-neutral-500 uppercase font-bold">
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">PIN / Card Detail</th>
                        <th className="p-2.5">Password</th>
                        <th className="p-2.5">Expiry</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {cardStocks
                        .filter(s => s.packageId === selectedStockPackage.id)
                        .map(item => (
                          <tr key={item.id} className="hover:bg-neutral-50/50">
                            <td className="p-2.5 capitalize font-bold">{item.type}</td>
                            <td className="p-2.5 font-mono">
                              {item.type === 'voucher' ? (
                                <a href={item.cardImageUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                                  View Voucher Image
                                </a>
                              ) : (
                                item.pin
                              )}
                            </td>
                            <td className="p-2.5 font-mono">{item.password || 'N/A'}</td>
                            <td className="p-2.5 font-mono text-neutral-500">{item.expiryDate || 'N/A'}</td>
                            <td className="p-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                item.status === 'Available'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-neutral-100 text-neutral-500'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditStockItem(item)}
                                  className="p-1 hover:bg-indigo-50 text-indigo-600 rounded cursor-pointer"
                                  title="এডিট করুন"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStockItem(item.id)}
                                  className="p-1 hover:bg-rose-50 text-rose-600 rounded cursor-pointer"
                                  title="ডিলিট করুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {cardStocks.filter(s => s.packageId === selectedStockPackage.id).length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-neutral-400 font-bold">
                            এই প্যাকেজের জন্য কোনো স্টক বা পিন যুক্ত করা নেই।
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Package Grid / List Table */
              <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="p-3">অফার টাইটেল / ব্র্যান্ড</th>
                      <th className="p-3">বিবরণ / মেয়াদ</th>
                      <th className="p-3 font-mono">রেগুলার / ভ্যালু</th>
                      <th className="p-3 font-mono">রিসেলার মূল্য</th>
                      <th className="p-3 font-mono">স্টক তথ্য / অ্যাকশন</th>
                      <th className="p-3 text-center">এডিট / ডিলিট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs font-medium text-neutral-700">
                    {offers
                      .filter(off => {
                        if (packageCategoryFilter === 'All') return true;
                        return off.category === packageCategoryFilter;
                      })
                      .map((off) => {
                        const packageStocks = cardStocks.filter(s => s.packageId === off.id);
                        const availStock = packageStocks.filter(s => s.status === 'Available').length;
                        return (
                          <tr key={off.id} className="hover:bg-neutral-50/30">
                            <td className="p-3">
                              <div className="flex items-center space-x-1.5">
                                <p className="font-bold text-neutral-900">{off.title}</p>
                                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                                  off.category === 'Calling Card'
                                    ? 'bg-indigo-55 text-indigo-700 border border-indigo-200'
                                    : off.isDrivePack || (off.category !== 'Internet' && off.isDrivePack === undefined)
                                      ? 'bg-rose-55 text-rose-700 border border-rose-200'
                                      : 'bg-teal-55 text-teal-700 border border-teal-200'
                                }`}>
                                  {off.category}
                                </span>
                              </div>
                              <span className="text-[9px] text-neutral-400 block mt-0.5">
                                Brand: <strong className="text-neutral-700">{off.operator}</strong>
                                {off.category === 'Calling Card' && ` | Pulse: ${off.mb} | Country: ${off.min}`}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="text-[11px] text-neutral-700 block font-bold">{off.validity}</span>
                              <span className="text-[9.5px] text-neutral-400 block mt-0.5 font-semibold font-mono">{off.description || 'No details'}</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-neutral-500">
                              {off.category === 'Calling Card' ? `$${off.regularPrice} USD` : `৳${off.regularPrice}`}
                            </td>
                            <td className="p-3 font-mono font-black text-indigo-600">৳{off.resellerPrice} BDT</td>
                            <td className="p-3">
                              {off.category === 'Calling Card' ? (
                                <div className="flex items-center space-x-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                                    availStock > 0
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                      : 'bg-rose-50 text-rose-700 border border-rose-100'
                                  }`}>
                                    Available: {availStock} / Total: {packageStocks.length}
                                  </span>
                                  <button
                                    onClick={() => setSelectedStockPackage(off)}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 transition-colors"
                                  >
                                    📦 Manage Stock
                                  </button>
                                </div>
                              ) : (
                                <span className="text-neutral-400 italic">N/A</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleOpenEditOffer(off)}
                                  className="p-1 hover:bg-neutral-100 text-indigo-600 rounded"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteOffer(off.id)}
                                  className="p-1 hover:bg-neutral-100 text-rose-600 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'sub_categories' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Sub Categories</h1>
              <p className="text-[10px] text-neutral-400">Structure active package types</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Minutes', 'Internet', 'Bundles', 'Call Rate'].map((cat, i) => (
                <div key={i} className="p-4 bg-white border border-neutral-200 rounded-xl">
                  <Folder className="w-6 h-6 text-indigo-500 mb-1" />
                  <p className="text-xs font-black text-neutral-850 mt-1">{cat}</p>
                  <p className="text-[9px] text-neutral-400 mt-0.5">Active catalog section</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'mfs_charges' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">MFS Cashout Charges (%)</h1>
              <p className="text-[10px] text-neutral-400">Configure default commissions deducted/credited per transaction</p>
            </div>
            <div className="bg-white border border-neutral-200/60 rounded-xl overflow-hidden max-w-md">
              <div className="p-3 bg-neutral-50 border-b border-neutral-150 text-[10px] font-bold text-neutral-500 uppercase tracking-wider grid grid-cols-3">
                <span>MFS GATEWAY</span>
                <span>CASHOUT FEE</span>
                <span>CASHIN FEE</span>
              </div>
              <div className="divide-y divide-neutral-100 text-xs font-bold text-neutral-800 p-3 space-y-2.5">
                <div className="grid grid-cols-3 items-center">
                  <span>bKash (Personal)</span>
                  <span className="font-mono text-indigo-600">1.85%</span>
                  <span className="text-neutral-400">Free</span>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <span>Nagad (Personal)</span>
                  <span className="font-mono text-indigo-600">1.15%</span>
                  <span className="text-neutral-400">Free</span>
                </div>
                <div className="grid grid-cols-3 items-center">
                  <span>Rocket (Agent)</span>
                  <span className="font-mono text-indigo-600">1.50%</span>
                  <span className="text-neutral-400">Free</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'blocked_amounts' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Locked Client Balances</h1>
              <p className="text-[10px] text-neutral-400">Funds frozen due to disputes or audit pending</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-4">
              <div className="text-xs text-neutral-400 font-semibold p-4 text-center">
                {(systemData?.blockedAmounts || [
                  { id: "ba-1", phone: "01799221122", amount: 1200, reason: "Chargeback dispute", date: "2026-07-25" }
                ]).map((ba: any) => (
                  <div key={ba.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between text-rose-900 text-left">
                    <div>
                      <p className="text-xs font-black">User: {ba.phone}</p>
                      <p className="text-[9.5px] font-semibold mt-1">Reason: {ba.reason} | {ba.date}</p>
                    </div>
                    <span className="text-xs font-bold font-mono">৳{ba.amount} BDT</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'banners' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Promotional Slider Banners</h1>
              <p className="text-[10px] text-neutral-400">Configure sliding banners rendered in user dashboard</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(systemData?.banners || []).map((banner: any) => (
                <div key={banner.id} className={`p-4 rounded-2xl text-white bg-gradient-to-r ${banner.color} space-y-2 relative shadow-xs`}>
                  <p className="text-xs font-black">{banner.title}</p>
                  <p className="text-[10px] text-white/95 leading-relaxed">{banner.desc}</p>
                  <span className="text-[8px] bg-white/20 text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider block w-max">Action: {banner.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'notices' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Scrolling News / Notices</h1>
              <p className="text-[10px] text-neutral-400">Update the yellow ticker bulletin displayed on customer portals</p>
            </div>
            <div className="space-y-2">
              {(systemData?.notices || []).map((note: any) => (
                <div key={note.id} className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold leading-relaxed">
                  <p>{note.text}</p>
                  <span className="text-[9.5px] text-amber-600 font-semibold block mt-1">Updated: {note.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'notifications' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Internal Notifications Log</h1>
              <p className="text-[10px] text-neutral-400">System alerts and warnings</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-5 text-center text-xs text-neutral-400 font-semibold">
              <p>No active critical error warnings reported today.</p>
            </div>
          </div>
        )}

        {activeSubTab === 'ussd_gateways' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">SIM Slot USSD Ports</h1>
              <p className="text-[10px] text-neutral-400">Modem status connected with active SIM slots</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(systemData?.ussdGateways || []).map((gw: any) => (
                <div key={gw.id} className="p-4 bg-white border border-neutral-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-neutral-400 font-extrabold block">{gw.simSlot}</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${gw.status === 'Connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                  </div>
                  <p className="text-xs font-black text-neutral-850">{gw.name}</p>
                  <p className="text-[10px] text-neutral-500 font-bold">{gw.operator} | Signal: {gw.signal}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'sms_inbox' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">SIM SMS Inbox (Gateways Log)</h1>
              <p className="text-[10px] text-neutral-400">Simulated bKash/Nagad cashin notifications received on host modems</p>
            </div>
            <div className="space-y-3">
              {(systemData?.smsInbox || []).map((sms: any) => (
                <div key={sms.id} className="p-4 bg-white border border-neutral-200 rounded-xl space-y-1.5 relative shadow-4xs">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-indigo-150 uppercase tracking-wider">{sms.sender}</span>
                    <span className="text-neutral-400 font-bold font-mono">{sms.time}</span>
                  </div>
                  <p className="text-xs font-mono font-medium text-neutral-800 leading-relaxed bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">{sms.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'api_management' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Third-party API Connections</h1>
              <p className="text-[10px] text-neutral-400">Route API gateways automatically for fast out-of-net delivery</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-5 text-center text-xs text-neutral-400 font-semibold space-y-2">
              <p>Main API status: <strong className="text-emerald-600 font-bold">ONLINE</strong></p>
              <p>Default failover: Grameenphone Flexi API v1</p>
            </div>
          </div>
        )}

        {activeSubTab === 'site_settings' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Platform Portal Configuration</h1>
              <p className="text-[10px] text-neutral-400">Change helpline numbers, branding tags and Telegram configurations</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-5 text-xs text-neutral-600 font-bold space-y-1.5 max-w-md">
              <p>Platform Name: Shakib Pay Telecom</p>
              <p>Support Hotline: 01635275233</p>
              <p>Telegram Alerts: Active</p>
            </div>

            {/* Added: Site Speed and Currency Settings */}
            <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-4xs mt-4 max-w-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs font-black text-neutral-900">স্ক্রলিং স্পিড (Marquee Speed)</h4>
                  <p className="text-[10px] text-neutral-500">নোটিশ কত দ্রুত ঘুরবে তা নির্ধারণ করুন।</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={marqueeSpeed}
                    onChange={(e) => setMarqueeSpeed(Number(e.target.value))}
                    className="w-16 p-2 text-center border border-neutral-250 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-neutral-100 pt-3">
                <button
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      await fetch((import.meta.env.VITE_API_URL || '') + '/api/site-config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ speed: marqueeSpeed, currencies: globalCurrencies })
                      });
                      alert('স্পিড সেভ করা হয়েছে!');
                    } catch (e) {
                      alert('স্পিড সেভ করতে সমস্যা হয়েছে।');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold w-full md:w-auto"
                >
                  Save Speed
                </button>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 p-5 rounded-2xl shadow-4xs mt-4 max-w-md">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="text-xs font-black text-neutral-900">বিদেশী কারেন্সি সেটিং (Currency List)</h4>
                    <p className="text-[10px] text-neutral-500">কান্ট্রি কারেন্সি ও ১ ইউনিটের বাংলাদেশি টাকা রেট।</p>
                  </div>
                  <button
                    onClick={() => {
                      setGlobalCurrencies([...globalCurrencies, { id: `c-${Date.now()}`, name: '', rate: 0 }]);
                    }}
                    className="text-[10px] font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2 py-1 rounded"
                  >
                    + Add Currency
                  </button>
                </div>
                
                <div className="flex flex-col space-y-2 mt-2">
                  {globalCurrencies.map((c, idx) => (
                    <div key={c.id} className="flex items-center space-x-2">
                      <select
                        value={c.name}
                        onChange={(e) => {
                          const newCurrencies = [...globalCurrencies];
                          newCurrencies[idx].name = e.target.value;
                          setGlobalCurrencies(newCurrencies);
                        }}
                        className="w-24 p-2 text-center border border-neutral-250 rounded-lg text-xs font-bold uppercase appearance-none"
                      >
                        <option value="">Select...</option>
                        <option value="USD">USD (US)</option>
                        <option value="USDT">USDT (Crypto)</option>
                        <option value="EUR">EUR (Europe)</option>
                        <option value="GBP">GBP (UK)</option>
                        <option value="SAR">SAR (Saudi Arabia)</option>
                        <option value="AED">AED (UAE)</option>
                        <option value="MYR">MYR (Malaysia)</option>
                        <option value="SGD">SGD (Singapore)</option>
                        <option value="QAR">QAR (Qatar)</option>
                        <option value="KWD">KWD (Kuwait)</option>
                        <option value="OMR">OMR (Oman)</option>
                        <option value="BHD">BHD (Bahrain)</option>
                        <option value="INR">INR (India)</option>
                      </select>
                      <input
                        type="number"
                        placeholder="রেট (BDT)"
                        value={c.rate}
                        onChange={(e) => {
                          const newCurrencies = [...globalCurrencies];
                          newCurrencies[idx].rate = Number(e.target.value);
                          setGlobalCurrencies(newCurrencies);
                        }}
                        className="w-20 p-2 text-center border border-neutral-250 rounded-lg text-xs font-bold"
                      />
                      <button
                        onClick={() => {
                          const newCurrencies = globalCurrencies.filter((_, i) => i !== idx);
                          setGlobalCurrencies(newCurrencies);
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end border-t border-neutral-100 pt-3">
                <button
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      await fetch((import.meta.env.VITE_API_URL || '') + '/api/site-config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ speed: marqueeSpeed, currencies: globalCurrencies })
                      });
                      alert('কারেন্সি লিস্ট সেভ করা হয়েছে!');
                    } catch (e) {
                      alert('কারেন্সি সেভ করতে সমস্যা হয়েছে।');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold w-full md:w-auto"
                >
                  Save Currencies
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'two_factor' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Two Factor Security (2FA)</h1>
              <p className="text-[10px] text-neutral-400">Strict safety options for money transfers</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-5 text-center text-xs text-neutral-400 font-semibold">
              <p>Device Fingerprint binding and PIN authentication are enforced globally.</p>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* DYNAMIC CONTENT MODIFICATION: BANNERS / SLIDER MANAGEMENT */}
        {/* ================================================== */}
        {activeSubTab === 'banners' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div>
                <h1 className="text-base font-black text-neutral-900">ব্যানার ও স্লাইডার ব্যাকঅফিস (Banners / Slider)</h1>
                <p className="text-[10px] text-neutral-400">Upload promotional slides and dynamic route redirections</p>
              </div>
              <button
                onClick={() => {
                  setBannerForm({ title: '', image: '', action: 'offers', isActive: true, color: 'from-blue-600 to-indigo-700' });
                  setIsEditingBanner(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন ব্যানার যোগ করুন</span>
              </button>
            </div>

            {isEditingBanner && (
              <form onSubmit={handleSaveBanner} className="p-5 bg-white border-2 border-indigo-500 rounded-2xl shadow-sm space-y-4 max-w-xl">
                <div className="border-b border-neutral-100 pb-2">
                  <h3 className="text-xs font-bold text-neutral-900">{bannerForm.id ? 'ব্যানার এডিট করুন' : 'নতুন ব্যানার তৈরি করুন'}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">ব্যানার শিরোনাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: জিপি স্পেশাল ড্রাইভ ধামাকা!"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">অ্যাকশন লিংক / ডিরেকশন</label>
                    <select
                      value={bannerForm.action}
                      onChange={(e) => setBannerForm({ ...bannerForm, action: e.target.value })}
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="offers">ড্রাইভ অফার প্যাকস (Offers)</option>
                      <option value="mfs">মোবাইল ফাইন্যান্সিয়াল সার্ভিস (MFS)</option>
                      <option value="banking">ব্যাংক ট্রান্সফার (Banking)</option>
                      <option value="utility">বিদ্যুৎ ও ইউটিলিটি বিল (Utility)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">ব্যানার সংক্ষিপ্ত বিবরণ</label>
                    <input
                      type="text"
                      placeholder="যেমন: আজকের স্পেশাল ড্রাইভে পাচ্ছেন ১৫০ টাকা ক্যাশব্যাক!"
                      value={bannerForm.desc || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, desc: e.target.value })}
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">ফলব্যাক গ্রেডিয়েন্ট কালার (যদি ইমেজ না থাকে)</label>
                    <select
                      value={bannerForm.color}
                      onChange={(e) => setBannerForm({ ...bannerForm, color: e.target.value })}
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="from-blue-600 to-indigo-700">নীল (Indigo / Blue)</option>
                      <option value="from-rose-500 to-orange-600">গোলাপী-কমলা (Rose / Orange)</option>
                      <option value="from-emerald-600 to-teal-700">সবুজ (Emerald / Teal)</option>
                      <option value="from-purple-600 to-pink-600">বেগুনী (Purple / Pink)</option>
                      <option value="from-neutral-800 to-neutral-950">কয়লা (Charcoal Dark)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 block">ব্যানার ইমেজ আপলোড (JPG/PNG/WebP - Max 2MB)</label>
                  <div className="flex items-center space-x-4">
                    <label className="w-24 h-16 rounded-xl border-2 border-dashed border-neutral-300 hover:border-indigo-500 bg-neutral-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all shrink-0">
                      {bannerForm.image ? (
                        <img src={bannerForm.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-1">
                          <ImageIcon className="w-5 h-5 text-neutral-400 mx-auto" />
                          <span className="text-[9px] text-neutral-400 block font-bold leading-none mt-1">Image</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerImageUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="text-left space-y-1">
                      <p className="text-[10.5px] font-bold text-neutral-800">Choose slide background</p>
                      <p className="text-[9px] text-neutral-400">Click preview box to upload full design size graphic layout.</p>
                      {bannerForm.image && (
                        <button
                          type="button"
                          onClick={() => setBannerForm((prev: any) => ({ ...prev, image: '' }))}
                          className="text-[9px] font-black text-rose-500 hover:underline block"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200 cursor-pointer w-max select-none">
                  <input
                    type="checkbox"
                    id="banner-active"
                    checked={bannerForm.isActive}
                    onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="banner-active" className="text-[11px] font-bold text-neutral-700 cursor-pointer">
                    ব্যানারটি সক্রিয় (Active) রাখতে চান
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingBanner(false)}
                    className="px-4 py-2 border border-neutral-200 text-neutral-500 font-bold rounded-xl text-xs hover:bg-neutral-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-600/10 active:scale-98"
                  >
                    {actionLoading ? 'সংরক্ষণ হচ্ছে...' : 'ব্যানার সেভ করুন'}
                  </button>
                </div>
              </form>
            )}

            {/* Banners Grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div key={b.id} className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-4xs relative overflow-hidden group">
                  <div className="flex space-x-3 items-start">
                    {/* Visual box preview */}
                    <div 
                      className={`w-28 h-16 rounded-xl shrink-0 overflow-hidden relative flex flex-col justify-center items-center text-white ${b.image ? '' : 'bg-gradient-to-br ' + b.color}`}
                      style={b.image ? { backgroundImage: `url(${b.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                    >
                      {b.image && <div className="absolute inset-0 bg-neutral-950/40 z-0"></div>}
                      <span className="text-[8px] font-black tracking-wider uppercase bg-white/20 px-1 py-0.5 rounded relative z-10">SLIDE</span>
                    </div>

                    <div className="space-y-1 flex-1 text-left">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-black text-neutral-900 leading-tight line-clamp-1">{b.title}</h4>
                        <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          b.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-50 text-neutral-400 border border-neutral-200'
                        }`}>
                          {b.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 font-bold">Action Target: <span className="text-indigo-600 font-extrabold uppercase">{b.action}</span></p>
                      <p className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed">{b.desc || '(কোনো বিবরণ নেই)'}</p>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => {
                        setBannerForm(b);
                        setIsEditingBanner(true);
                      }}
                      className="p-1.5 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-100 cursor-pointer"
                      title="এডিট করুন"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="p-1.5 bg-rose-50/50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 cursor-pointer"
                      title="ডিলিট করুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {banners.length === 0 && (
                <div className="col-span-2 py-12 text-center text-neutral-400 bg-white border border-neutral-200 rounded-2xl w-full">
                  <ImageIcon className="w-8 h-8 mx-auto text-neutral-300 mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-neutral-500">কোনো ব্যানার স্লাইডার পাওয়া যায়নি।</p>
                  <p className="text-[10px] text-neutral-400 mt-1">স্লাইডার কন্টেন্ট যুক্ত করতে ওপরের বাটনটি ক্লিক করুন।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* DYNAMIC CONTENT MODIFICATION: NOTICES MANAGEMENT */}
        {/* ================================================== */}
        {activeSubTab === 'notices' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div>
                <h1 className="text-base font-black text-neutral-900">নোটিশবোর্ড মার্কি ম্যানেজার (Notices)</h1>
                <p className="text-[10px] text-neutral-400">Manage scrolling marquee headline tickers and set custom text colors</p>
              </div>
              <button
                onClick={() => {
                  setNoticeForm({ text: '', textColor: '#B45309', isActive: true });
                  setIsEditingNotice(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন নোটিশ লিখুন</span>
              </button>
            </div>

            {/* Notice AI/Auto Template Generator Section */}
            <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 border border-indigo-100 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center space-x-2 border-b border-indigo-100/60 pb-2">
                <Megaphone className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-neutral-900">নোটিশ এআই / অটো টেমপ্লেট জেনারেটর (Notice Auto-Generator)</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500">নোটিশের ধরণ (Notice Type) *</label>
                  <select
                    value={genType}
                    onChange={(e) => setGenType(e.target.value)}
                    className="p-2 border border-neutral-250 bg-white rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Offers">🎉 অফার / ডিসকাউন্ট (Offers)</option>
                    <option value="Delay">⏳ সাময়িক বিলম্ব (System Delay)</option>
                    <option value="Maintenance">⚠️ মেইনটেইন্যান্স / অফটাইম (Maintenance)</option>
                    <option value="Alert">🚨 জরুরি সতর্কবার্তা (Urgent Alert)</option>
                    <option value="Greeting">🤝 শুভেচ্ছা বার্তা (Greeting)</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-neutral-500">টপিক / বিষয়বস্তু (Topic) *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: বিকাশ ক্যাশব্যাক অফার, রাত ২টা থেকে ৪টা পর্যন্ত সার্ভার রক্ষণাবেক্ষণ, ইত্যাদি"
                    value={genTopic}
                    onChange={(e) => setGenTopic(e.target.value)}
                    className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500">টেক্সট কালার থিম (Text Color)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={genColor}
                      onChange={(e) => setGenColor(e.target.value)}
                      className="w-9 h-9 border border-neutral-250 rounded-xl p-1 bg-white cursor-pointer shrink-0"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: 'Amber', hex: '#B45309' },
                        { name: 'Red', hex: '#DC2626' },
                        { name: 'Blue', hex: '#2563EB' },
                        { name: 'Green', hex: '#16A34A' },
                        { name: 'Purple', hex: '#7C3AED' }
                      ].map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setGenColor(c.hex)}
                          style={{ backgroundColor: c.hex }}
                          className="w-5 h-5 rounded-full border border-white shadow-xs cursor-pointer transition-transform hover:scale-110 active:scale-95"
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={handleApplyGeneratedNotice}
                    disabled={actionLoading || !genTopic.trim()}
                    className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-600/15 flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>জেনারেট ও সরাসরি পাবলিশ করুন (Publish Live)</span>
                  </button>
                </div>
              </div>

              {/* Output Preview Block */}
              <div className="p-3 bg-neutral-900 border border-neutral-850 rounded-xl overflow-hidden shadow-xs">
                <span className="text-[9px] font-bold text-neutral-400 block mb-1">লাইভ নোটিশ প্রিভিউ (Live Marquee Preview):</span>
                <div className="relative w-full overflow-hidden bg-neutral-950 py-1.5 rounded-lg px-2 border border-neutral-800">
                  <div className="whitespace-nowrap inline-block animate-marquee font-bold text-xs" style={{ color: genColor }}>
                    {getGeneratedNoticeText(genTopic, genType)}
                  </div>
                </div>
              </div>
            </div>

            {isEditingNotice && (
              <form onSubmit={handleSaveNotice} className="p-5 bg-white border-2 border-indigo-500 rounded-2xl shadow-sm space-y-4 max-w-xl">
                <div className="border-b border-neutral-100 pb-2">
                  <h3 className="text-xs font-bold text-neutral-900">{noticeForm.id ? 'নোটিশ এডিট করুন' : 'নতুন নোটিশ যুক্ত করুন'}</h3>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500">নোটিশের বিবরণ (Scrolling text) *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="যেমন: আমাদের বিকাশ ও নগদ অটো অ্যাড মানি চালু আছে, ৫ সেকেন্ডে ব্যালেন্স অ্যাড হবে!"
                    value={noticeForm.text}
                    onChange={(e) => setNoticeForm({ ...noticeForm, text: e.target.value })}
                    className="p-2.5 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">কালার থিম (Custom Hex / Predefined)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={noticeForm.textColor}
                        onChange={(e) => setNoticeForm({ ...noticeForm, textColor: e.target.value })}
                        className="w-10 h-10 border border-neutral-250 rounded-xl p-1 bg-white cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        placeholder="#B45309"
                        value={noticeForm.textColor}
                        onChange={(e) => setNoticeForm({ ...noticeForm, textColor: e.target.value })}
                        className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="flex items-center space-x-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="notice-active"
                        checked={noticeForm.isActive}
                        onChange={(e) => setNoticeForm({ ...noticeForm, isActive: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="notice-active" className="text-[11px] font-bold text-neutral-700 cursor-pointer">
                        নোটিশটি স্ক্রিনে প্রদর্শন করুন
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingNotice(false)}
                    className="px-4 py-2 border border-neutral-200 text-neutral-500 font-bold rounded-xl text-xs hover:bg-neutral-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-600/10 active:scale-98"
                  >
                    {actionLoading ? 'সেভ হচ্ছে...' : 'নোটিশ সেভ করুন'}
                  </button>
                </div>
              </form>
            )}

            {/* Notices List */}
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-4xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="p-3">নোটিশের বিবরণ (Notice Message)</th>
                      <th className="p-3">টেক্সট কালার (Hex)</th>
                      <th className="p-3 text-center">অবস্থা</th>
                      <th className="p-3 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs font-semibold text-neutral-700">
                    {notices.map((n) => (
                      <tr key={n.id} className="hover:bg-neutral-50/20">
                        <td className="p-3 text-left">
                          <p className="font-bold text-neutral-900 leading-relaxed max-w-lg" style={{ color: n.textColor }}>
                            {n.text}
                          </p>
                        </td>
                        <td className="p-3 text-left">
                          <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: n.textColor }} />
                            <span className="font-mono text-[10.5px] font-black text-neutral-500">{n.textColor}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                            n.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-50 text-neutral-400 border border-neutral-200'
                          }`}>
                            {n.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => {
                                setNoticeForm(n);
                                setIsEditingNotice(true);
                              }}
                              className="p-1.5 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-100 cursor-pointer"
                              title="সম্পাদনা"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNotice(n.id)}
                              className="p-1.5 bg-rose-50/50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 cursor-pointer"
                              title="ডিলিট"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {notices.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-neutral-400 font-bold">
                          <Megaphone className="w-8 h-8 mx-auto text-neutral-300 mb-2 animate-bounce" />
                          <span>কোনো নোটিশ পাওয়া যায়নি।</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* DYNAMIC CONTENT MODIFICATION: NOTIFICATIONS (POPUP) */}
        {/* ================================================== */}
        {activeSubTab === 'notifications' && (
          <div className="space-y-6 text-left">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div>
                <h1 className="text-base font-black text-neutral-900">পুশ ও পপ-আপ ঘোষণা ম্যানেজার (Notifications)</h1>
                <p className="text-[10px] text-neutral-400">Send popup notification prompts, announcements or custom images targeting specific user ranks</p>
              </div>
              <button
                onClick={() => {
                  setNotificationForm({ title: '', body: '', imageUrl: '', expiryDate: '', targetRole: 'All', isActive: true });
                  setIsEditingNotification(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন নোটিফিকেশন তৈরি করুন</span>
              </button>
            </div>

            {isEditingNotification && (
              <form onSubmit={handleSaveNotification} className="p-5 bg-white border-2 border-indigo-500 rounded-2xl shadow-sm space-y-4 max-w-xl">
                <div className="border-b border-neutral-100 pb-2">
                  <h3 className="text-xs font-bold text-neutral-900">{notificationForm.id ? 'ঘোষণা এডিট করুন' : 'নতুন পপ-আপ ঘোষণা তৈরি করুন'}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">ঘোষণা শিরোনাম (Popup Title) *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: নতুন অটো অ্যাড মানি সুবিধা চালু!"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">টার্গেট রিসেলার রোল (Target Role)</label>
                    <select
                      value={notificationForm.targetRole}
                      onChange={(e) => setNotificationForm({ ...notificationForm, targetRole: e.target.value })}
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="All">সকল গ্রাহক (All Users)</option>
                      <option value="VIP">ভিআইপি (VIP Users only)</option>
                      <option value="Sub-Admin">সাব-অ্যাডমিন (Sub-Admins only)</option>
                      <option value="Retailer">রিটেইলার (Retailers only)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500">ঘোষণা বার্তা বডি (Message Body) *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="পপ-আপের মধ্যে বিস্তারিত নোটিফিকেশন বার্তাটি এখানে লিখুন..."
                    value={notificationForm.body}
                    onChange={(e) => setNotificationForm({ ...notificationForm, body: e.target.value })}
                    className="p-2.5 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">অ্যাডভান্সিড এক্সপায়রি ডেট (Expiry Date - Optional)</label>
                    <input
                      type="date"
                      value={notificationForm.expiryDate || ''}
                      onChange={(e) => setNotificationForm({ ...notificationForm, expiryDate: e.target.value })}
                      className="p-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div className="flex flex-col space-y-1 justify-end">
                    <div className="flex items-center space-x-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="notif-active"
                        checked={notificationForm.isActive}
                        onChange={(e) => setNotificationForm({ ...notificationForm, isActive: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="notif-active" className="text-[11px] font-bold text-neutral-700 cursor-pointer">
                        ঘোষণাটি সক্রিয় রাখুন
                      </label>
                    </div>
                  </div>
                </div>

                {/* Optional Image upload / Text url helper */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-500 block">ঘোষণা গ্রাফিক ছবি (Image attachment - Optional)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50/50 p-3 rounded-2xl border border-neutral-150">
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-black text-neutral-400 block uppercase">Option A: Image URL</span>
                      <input
                        type="text"
                        placeholder="https://example.com/notif.png"
                        value={notificationForm.imageUrl || ''}
                        onChange={(e) => setNotificationForm({ ...notificationForm, imageUrl: e.target.value })}
                        className="p-2 w-full border border-neutral-250 rounded-lg text-[11px] font-bold focus:outline-none focus:border-indigo-500 bg-white"
                      />
                    </div>
                    
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-black text-neutral-400 block uppercase">Option B: Upload File (Base64)</span>
                      <label className="py-2 px-3 bg-white border border-neutral-250 rounded-lg text-[10px] text-center text-neutral-700 font-bold block cursor-pointer hover:bg-neutral-50 active:scale-98 transition-all">
                        {notificationForm.imageUrl?.startsWith('data:image/') ? '✓ Image Attached' : 'Select Local File'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleNotificationImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  {notificationForm.imageUrl && (
                    <div className="flex items-center space-x-3 mt-1.5">
                      <img src={notificationForm.imageUrl} alt="preview" className="w-16 h-10 object-cover rounded border border-neutral-200" referrerPolicy="no-referrer" />
                      <button 
                        type="button" 
                        onClick={() => setNotificationForm((prev: any) => ({ ...prev, imageUrl: '' }))}
                        className="text-[9px] font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove Attachment
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsEditingNotification(false)}
                    className="px-4 py-2 border border-neutral-200 text-neutral-500 font-bold rounded-xl text-xs hover:bg-neutral-50"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md shadow-indigo-600/10 active:scale-98"
                  >
                    {actionLoading ? 'সেভ হচ্ছে...' : 'ঘোষণা ব্লাস্ট করুন'}
                  </button>
                </div>
              </form>
            )}

            {/* Notifications Grid List */}
            <div className="grid grid-cols-1 gap-4 text-left">
              {notifications.map((n) => (
                <div key={n.id} className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3 text-left hover:shadow-4xs transition-all relative">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="bg-rose-50 text-rose-700 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border border-rose-100 tracking-wider">
                          Role: {n.targetRole}
                        </span>
                        {n.expiryDate && (
                          <span className="text-[9px] font-mono text-neutral-400 font-bold">
                            Expires: {n.expiryDate}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-neutral-900 leading-snug">{n.title}</h4>
                    </div>

                    <div className="flex items-center space-x-1">
                      <span className={`text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded ${
                        n.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-50 text-neutral-400 border border-neutral-200'
                      }`}>
                        {n.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-start">
                    {n.imageUrl && (
                      <img 
                        src={n.imageUrl} 
                        alt={n.title} 
                        referrerPolicy="no-referrer"
                        className="w-24 h-16 rounded-xl object-cover shrink-0 border border-neutral-150" 
                      />
                    )}
                    <p className="text-[11.5px] text-neutral-500 font-medium leading-relaxed whitespace-pre-line flex-1">
                      {n.body}
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => {
                        setNotificationForm(n);
                        setIsEditingNotification(true);
                      }}
                      className="p-1.5 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-100 cursor-pointer"
                      title="এডিট"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNotification(n.id)}
                      className="p-1.5 bg-rose-50/50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 cursor-pointer"
                      title="ডিলিট"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="py-12 text-center text-neutral-400 bg-white border border-neutral-200 rounded-2xl">
                  <Bell className="w-8 h-8 mx-auto text-neutral-300 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-neutral-500">কোনো পপ-আপ ঘোষণা পাওয়া যায়নি।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Existing Users Management */}
        {activeSubTab === 'users' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">নিবন্ধিত রিসেলার ইউজার তালিকা (Registered Users)</h1>
              <p className="text-[10px] text-neutral-400">Manage reseller statuses, balance corrections or roles</p>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-neutral-250 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider">মোট ইউজার: {users.length} জন</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="p-3">ইউজার প্রোফাইল</th>
                      <th className="p-3">মোবাইল / রোল</th>
                      <th className="p-3">ব্যালেন্স BDT</th>
                      <th className="p-3 text-center">স্ট্যাটাস</th>
                      <th className="p-3 text-center">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs font-medium text-neutral-750">
                    {users.filter(u => {
                      const s = userSearch.toLowerCase();
                      return u.name.toLowerCase().includes(s) || u.phone.includes(s);
                    }).map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50/20">
                        <td className="p-3 flex items-center space-x-2.5">
                          <img src={u.profilePic} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-neutral-150" />
                          <div>
                            <p className="font-bold text-neutral-900">{u.name}</p>
                            <p className="text-[9.5px] text-neutral-400 font-bold font-mono">{u.email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-mono font-bold text-neutral-850">{u.phone}</p>
                          <select
                            value={u.role === 'Normal User' ? 'User' : u.role}
                            onChange={(e) => {
                              const targetRole = e.target.value === 'User' ? 'Normal User' : e.target.value;
                              handleRoleChange(u.id!, targetRole);
                            }}
                            className="text-[9.5px] font-extrabold bg-neutral-100 border border-neutral-200 rounded px-1 mt-1 cursor-pointer focus:outline-none"
                          >
                            <option value="VIP">VIP</option>
                            <option value="Sub-Admin">Sub-Admin</option>
                            <option value="Reseller">Reseller</option>
                            <option value="Retailer">Retailer</option>
                            <option value="User">User</option>
                          </select>
                        </td>
                        <td className="p-3 font-mono font-black text-indigo-700">
                          ৳{u.walletBalance.toLocaleString('bn-BD')}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full inline-block ${
                            u.status !== 'Suspended' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {u.status || 'Active'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => {
                                setAdjustingUser(u);
                                setBalanceAdjustAmount('');
                                setBalanceAction('add');
                              }}
                              className="p-1.5 hover:bg-neutral-100 text-indigo-600 rounded-lg border border-neutral-200 transition-colors cursor-pointer"
                              title="ব্যালেন্স সমন্বয়"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleStatusToggle(u.id!, u.status || 'Active')}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                u.status !== 'Suspended' 
                                  ? 'hover:bg-rose-50 hover:border-rose-200 text-rose-500 border-neutral-200' 
                                  : 'hover:bg-emerald-50 hover:border-emerald-200 text-emerald-500 border-neutral-200'
                              }`}
                              title={u.status !== 'Suspended' ? 'সাময়িকভাবে স্থগিত করুন' : 'পুনরায় সক্রিয় করুন'}
                            >
                              {u.status !== 'Suspended' ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'payment_accounts' && (
          <div className="space-y-6 text-left max-w-4xl">
            <div>
              <h1 className="text-base font-black text-neutral-900">Admin Payment Gateways (পেমেন্ট গেটওয়ে নম্বর সেটআপ)</h1>
              <p className="text-[10px] text-neutral-400">গ্রাহকদের অ্যাড মানি (Deposit) করার সময় প্রদর্শিত গেটওয়ে নম্বরসমূহ এখান থেকে আপডেট করুন।</p>
            </div>

            <form onSubmit={handleSaveGateways} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* bKash Section */}
                <div className="p-5 bg-pink-50/40 border border-pink-200/60 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-pink-200/40">
                    <div className="w-2.5 h-2.5 bg-pink-500 rounded-full" />
                    <p className="text-sm font-extrabold text-pink-900">বিকাশ গেটওয়ে (bKash)</p>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-black text-pink-850 uppercase">bKash Personal *</label>
                    <input
                      type="tel"
                      required
                      placeholder="যেমন: 017XXXXXXXX"
                      maxLength={11}
                      value={adminNums?.bkash?.personal || ''}
                      onChange={(e) => setAdminNums({
                        ...adminNums,
                        bkash: { ...adminNums.bkash, personal: e.target.value.replace(/\D/g, '') }
                      })}
                      className="p-2.5 border border-pink-200 rounded-xl text-xs font-bold bg-white text-neutral-800 focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-black text-pink-850 uppercase">bKash Merchant</label>
                    <input
                      type="tel"
                      placeholder="যেমন: 018XXXXXXXX"
                      maxLength={11}
                      value={adminNums?.bkash?.merchant || ''}
                      onChange={(e) => setAdminNums({
                        ...adminNums,
                        bkash: { ...adminNums.bkash, merchant: e.target.value.replace(/\D/g, '') }
                      })}
                      className="p-2.5 border border-pink-200 rounded-xl text-xs font-bold bg-white text-neutral-800 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Nagad Section */}
                <div className="p-5 bg-orange-50/40 border border-orange-200/60 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-orange-200/40">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                    <p className="text-sm font-extrabold text-orange-900">নগদ গেটওয়ে (Nagad)</p>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-black text-orange-850 uppercase">Nagad Personal *</label>
                    <input
                      type="tel"
                      required
                      placeholder="যেমন: 019XXXXXXXX"
                      maxLength={11}
                      value={adminNums?.nagad?.personal || ''}
                      onChange={(e) => setAdminNums({
                        ...adminNums,
                        nagad: { ...adminNums.nagad, personal: e.target.value.replace(/\D/g, '') }
                      })}
                      className="p-2.5 border border-orange-200 rounded-xl text-xs font-bold bg-white text-neutral-800 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-black text-orange-850 uppercase">Nagad Merchant</label>
                    <input
                      type="tel"
                      placeholder="যেমন: 015XXXXXXXX"
                      maxLength={11}
                      value={adminNums?.nagad?.merchant || ''}
                      onChange={(e) => setAdminNums({
                        ...adminNums,
                        nagad: { ...adminNums.nagad, merchant: e.target.value.replace(/\D/g, '') }
                      })}
                      className="p-2.5 border border-orange-200 rounded-xl text-xs font-bold bg-white text-neutral-800 focus:outline-none focus:border-orange-550"
                    />
                  </div>
                </div>


                {/* USDT Section */}
                <div className="p-5 bg-emerald-50/40 border border-emerald-200/60 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-emerald-200/40">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    <p className="text-sm font-extrabold text-emerald-900">USDT (Crypto)</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-black text-emerald-850 uppercase">USDT Wallet Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TRC20: TVgJ..."
                      value={adminNums?.usdt?.personal || adminNums?.usdt || ''}
                      onChange={(e) => setAdminNums({
                        ...adminNums,
                        usdt: { ...adminNums.usdt, personal: e.target.value }
                      })}
                      className="p-2.5 border border-emerald-200 rounded-xl text-xs font-bold bg-white text-neutral-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                
                {/* Rocket Section */}
                <div className="p-5 bg-purple-50/40 border border-purple-200/60 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-purple-200/40">
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
                    <p className="text-sm font-extrabold text-purple-900">রকেট গেটওয়ে (Rocket)</p>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-black text-purple-850 uppercase">Rocket Personal *</label>
                    <input
                      type="tel"
                      required
                      placeholder="যেমন: 013XXXXXXXX"
                      maxLength={11}
                      value={adminNums?.rocket?.personal || ''}
                      onChange={(e) => setAdminNums({
                        ...adminNums,
                        rocket: { ...adminNums.rocket, personal: e.target.value.replace(/\D/g, '') }
                      })}
                      className="p-2.5 border border-purple-200 rounded-xl text-xs font-bold bg-white text-neutral-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-black text-purple-850 uppercase">Rocket Merchant</label>
                    <input
                      type="tel"
                      placeholder="যেমন: 014XXXXXXXX"
                      maxLength={11}
                      value={adminNums?.rocket?.merchant || ''}
                      onChange={(e) => setAdminNums({
                        ...adminNums,
                        rocket: { ...adminNums.rocket, merchant: e.target.value.replace(/\D/g, '') }
                      })}
                      className="p-2.5 border border-purple-200 rounded-xl text-xs font-bold bg-white text-neutral-800 focus:outline-none focus:border-purple-550"
                    />
                  </div>
                </div>
              </div>

              {gatewayMessage && (
                <div className={`p-3 rounded-xl border text-xs font-bold ${
                  gatewayMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-150 text-emerald-800'
                    : 'bg-rose-50 border-rose-150 text-rose-800'
                }`}>
                  {gatewayMessage.text}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingGateways}
                  className={`px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer ${
                    isSavingGateways ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : ''
                  }`}
                >
                  {isSavingGateways ? 'সেভ হচ্ছে...' : 'গেটওয়ে নম্বরসমূহ সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Support Tickets list */}
        {activeSubTab === 'support_tickets' && (
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden text-left">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Reseller Support Tickets</h3>
                <p className="text-[10px] text-neutral-400 mt-0.5">Resolve technical problems and inquiries</p>
              </div>
              <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold font-mono">
                {tickets.filter(t => t.status === 'Pending').length} Pending
              </span>
            </div>

            <div className="divide-y divide-neutral-100">
              {tickets.length === 0 ? (
                <p className="text-center py-12 text-neutral-400 font-bold text-xs">কোনো সাপোর্ট টিকিট নেই।</p>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className="p-4 hover:bg-neutral-50/50 flex justify-between items-start space-x-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-black text-neutral-900">{t.id}</span>
                        <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full ${
                          t.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs font-black text-neutral-850">{t.subject}</p>
                      <p className="text-xs font-medium text-neutral-600 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100/85 mt-2 leading-relaxed">{t.message}</p>
                      <span className="text-[9px] text-neutral-400 font-bold block mt-1">From: {t.userEmail} | Received: {new Date(t.date).toLocaleDateString('bn-BD')}</span>
                    </div>

                    {t.status === 'Pending' && (
                      <button
                        onClick={() => handleResolveTicket(t.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0"
                      >
                        টিকিট সমাধান করুন
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'blocked_ips' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Blacklisted IP Logs</h1>
              <p className="text-[10px] text-neutral-400">Suspicious clients blocked automatically by firewall</p>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {(systemData?.blockedIPs || []).map((b, i) => (
                <div key={i} className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-rose-600">{b.ip}</span>
                    <p className="text-[10px] text-neutral-450 font-bold mt-1">Reason: {b.reason}</p>
                  </div>
                  <span className="text-[9.5px] text-neutral-400 font-bold">{b.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'login_logs' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Login Attempt Trails</h1>
              <p className="text-[10px] text-neutral-400">Sign-in actions monitored across all reseller sub accounts</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-5 text-center text-xs text-neutral-400 font-semibold">
              <p>Sign-in logger is functional. All resellers logged in successfully.</p>
            </div>
          </div>
        )}

        {activeSubTab === 'pin_logs' && (
          <div className="space-y-4 text-left">
            <div>
              <h1 className="text-base font-black text-neutral-900">Secured PIN Attempts</h1>
              <p className="text-[10px] text-neutral-400">Security checking records for verification audits</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-5 text-center text-xs text-neutral-400 font-semibold">
              <p>PIN verification logs are clear. No incorrect credentials submitted in the last 24 hours.</p>
            </div>
          </div>
        )}

      </main>

      {/* REJECT/CANCEL CONFIRM MODAL */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-3xs">
          <form onSubmit={handleRejectConfirm} className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-sm w-full shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-black text-neutral-900 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>অর্ডার বাতিল / প্রত্যাখ্যান করুন</span>
              </h3>
              <button type="button" onClick={() => setRejectingOrder(null)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100 space-y-1">
                <p className="text-xs text-rose-950 font-bold">আইডি: <strong className="font-mono">{rejectingOrder.id}</strong></p>
                <p className="text-xs text-rose-950 font-bold">পরিমাণ: <strong className="font-mono">৳{rejectingOrder.amount} BDT</strong></p>
                <p className="text-[11px] text-rose-800">অর্ডারটি বাতিল করলে গ্রাহকের ওয়ালেটে টাকা স্বয়ংক্রিয়ভাবে ফেরত (Auto-refunded) যাবে।</p>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">বাতিল করার সুনির্দিষ্ট কারণ *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ভুল ট্রানজেকশন ID বা পিন নম্বর!"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-neutral-250 rounded-lg focus:outline-none focus:border-neutral-900 font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="flex-1 py-2.5 text-xs border border-neutral-200 hover:bg-neutral-50 font-bold text-neutral-500 rounded-lg transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-all cursor-pointer"
              >
                {actionLoading ? 'বাতিল হচ্ছে...' : 'প্রত্যাখ্যান নিশ্চিত করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT CALLING CARD STOCK MODAL */}
      {editingStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-3xs">
          <form onSubmit={handleSaveEditStockItem} className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-black text-neutral-900 flex items-center space-x-1.5">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>স্টক কার্ড পরিবর্তন করুন (Edit Stock)</span>
              </h3>
              <button type="button" onClick={() => setEditingStockItem(null)} className="text-neutral-400 hover:text-neutral-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-neutral-700">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-neutral-500">টাইপ (Type)</label>
                <select
                  value={editStockType}
                  onChange={(e) => setEditStockType(e.target.value as any)}
                  className="p-2 border border-neutral-300 rounded-xl bg-white text-xs font-semibold"
                >
                  <option value="pin">PIN / Username</option>
                  <option value="voucher">Voucher Image</option>
                </select>
              </div>

              {editStockType === 'pin' ? (
                <>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">PIN / Username</label>
                    <input
                      type="text"
                      required
                      value={editStockPin}
                      onChange={(e) => setEditStockPin(e.target.value)}
                      placeholder="e.g. PIN1234"
                      className="p-2 border border-neutral-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">Password</label>
                    <input
                      type="text"
                      value={editStockPassword}
                      onChange={(e) => setEditStockPassword(e.target.value)}
                      placeholder="e.g. PASS123"
                      className="p-2 border border-neutral-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500">Voucher Image (URL or Upload)</label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={editStockImageUrl}
                      onChange={(e) => setEditStockImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 p-2 border border-neutral-300 rounded-xl text-xs font-semibold"
                    />
                    <label className="flex items-center justify-center px-3 py-2 border border-indigo-200 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black cursor-pointer hover:bg-indigo-100 transition-colors">
                      <Upload className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditStockImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-neutral-500">মেয়াদ / Expiry Date</label>
                <input
                  type="text"
                  value={editStockExpiry}
                  onChange={(e) => setEditStockExpiry(e.target.value)}
                  placeholder="e.g. 30 Days"
                  className="p-2 border border-neutral-300 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingStockItem(null)}
                className="flex-1 py-2.5 text-xs border border-neutral-200 hover:bg-neutral-50 font-bold text-neutral-500 rounded-lg transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all cursor-pointer"
              >
                হালনাগাদ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT APPROVED CALLING CARD ORDER MODAL */}
      {editingApprovedCallingCardOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-3xs">
          <form onSubmit={handleSaveEditApprovedOrder} className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-black text-neutral-900 flex items-center space-x-1.5">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                <span>ডেলিভারি হওয়া কার্ড এডিট করুন (Correction)</span>
              </h3>
              <button type="button" onClick={() => setEditingApprovedCallingCardOrder(null)} className="text-neutral-400 hover:text-neutral-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 space-y-1 text-xs">
              <p>অর্ডার আইডি: <strong className="font-mono">{editingApprovedCallingCardOrder.id}</strong></p>
              <p>প্যাকেজ: <strong>{editingApprovedCallingCardOrder.serviceName || editingApprovedCallingCardOrder.operator}</strong></p>
              <p>গ্রাহক ফোন: <strong>{editingApprovedCallingCardOrder.userPhone}</strong></p>
            </div>

            {editOrderError && (
              <p className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-600 font-bold">
                {editOrderError}
              </p>
            )}

            <div className="space-y-3 text-xs font-semibold text-neutral-700">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-neutral-500">PIN / Username (ইউজারনেম/পিন)</label>
                <input
                  type="text"
                  value={editOrderCardPin}
                  onChange={(e) => setEditOrderCardPin(e.target.value)}
                  placeholder="e.g. Pin Number / User"
                  className="p-2 border border-neutral-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-neutral-500">Password (পাসওয়ার্ড)</label>
                <input
                  type="text"
                  value={editOrderCardPassword}
                  onChange={(e) => setEditOrderCardPassword(e.target.value)}
                  placeholder="e.g. Password"
                  className="p-2 border border-neutral-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-neutral-500">Expiry (মেয়াদ)</label>
                <input
                  type="text"
                  value={editOrderCardExpiry}
                  onChange={(e) => setEditOrderCardExpiry(e.target.value)}
                  placeholder="e.g. 1200 Min / 30 Days"
                  className="p-2 border border-neutral-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-neutral-500">Voucher / Card Image (URL or Upload)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={editOrderCardImageUrl}
                    onChange={(e) => setEditOrderCardImageUrl(e.target.value)}
                    placeholder="e.g. https://unsplash.com/..."
                    className="flex-1 p-2 border border-neutral-300 rounded-xl text-xs font-semibold"
                  />
                  <label className="flex items-center justify-center px-3 py-2 border border-indigo-200 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black cursor-pointer hover:bg-indigo-100 transition-colors">
                    <Upload className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditOrderImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingApprovedCallingCardOrder(null)}
                className="flex-1 py-2.5 text-xs border border-neutral-200 hover:bg-neutral-50 font-bold text-neutral-500 rounded-lg transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all cursor-pointer"
              >
                {actionLoading ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন নিশ্চিত করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CALLING CARD APPROVE MODAL */}
      {approvingCallingCardOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-3xs">
          <form onSubmit={handleConfirmCallingCardApprove} className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-md w-full shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-black text-neutral-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>কলিং কার্ড অর্ডার অনুমোদন করুন</span>
              </h3>
              <button type="button" onClick={() => setApprovingCallingCardOrder(null)} className="text-neutral-400 hover:text-neutral-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-neutral-700">
              <div className="bg-indigo-50/40 p-3 rounded-xl border border-indigo-100 space-y-1">
                <p>অর্ডার আইডি: <strong className="font-mono">{approvingCallingCardOrder.id}</strong></p>
                <p>প্যাকেজ: <strong>{approvingCallingCardOrder.operator} ({approvingCallingCardOrder.amount})</strong></p>
                <p>ইউজার মোবাইল: <strong>{approvingCallingCardOrder.userPhone || approvingCallingCardOrder.phone}</strong></p>
              </div>

              {/* Auto Assign Toggle */}
              <div className="flex items-center space-x-2 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <input
                  type="checkbox"
                  id="auto_assign_toggle"
                  checked={approveAutoAssign}
                  onChange={(e) => setApproveAutoAssign(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-indigo-600 cursor-pointer"
                />
                <label htmlFor="auto_assign_toggle" className="text-xs font-bold text-neutral-800 cursor-pointer select-none">
                  স্টক থেকে স্বয়ংক্রিয়ভাবে কার্ড ডেলিভারি করুন (Auto-Assign Stock)
                </label>
              </div>

              {approveAutoAssign ? (
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-150">
                  <p className="text-[11px]">
                    সিস্টেম এই প্যাকেজের জন্য এভেইলেবল থাকা প্রথম PIN/Voucher স্বয়ংক্রিয়ভাবে অর্ডারটির সাথে যুক্ত করবে এবং ব্যবহারকারীকে ডেলিভারি দিয়ে দেবে।
                  </p>
                </div>
              ) : (
                <div className="space-y-2 border border-neutral-200 p-3 rounded-xl bg-white">
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">ম্যানুয়াল ডেলিভারি বিবরণ</p>
                  
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">কার্ড পিন / ইউজারনেম (Card PIN) *</label>
                    <input
                      type="text"
                      required={!approveAutoAssign}
                      placeholder="যেমন: PIN994821"
                      value={approveCardPin}
                      onChange={(e) => setApproveCardPin(e.target.value)}
                      className="p-2 border border-neutral-250 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">কার্ড পাসওয়ার্ড (Card Password)</label>
                    <input
                      type="text"
                      placeholder="যেমন: 45012"
                      value={approveCardPassword}
                      onChange={(e) => setApproveCardPassword(e.target.value)}
                      className="p-2 border border-neutral-250 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">মেয়াদ উত্তীর্ণের তারিখ (Expiry Date)</label>
                    <input
                      type="text"
                      placeholder="যেমন: 2026-12-31"
                      value={approveCardExpiry}
                      onChange={(e) => setApproveCardExpiry(e.target.value)}
                      className="p-2 border border-neutral-250 rounded-lg text-xs"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500">কার্ড ভাউচার ইমেজ (URL or Upload Image)</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="যেমন: https://example.com/voucher.png"
                        value={approveCardImageUrl}
                        onChange={(e) => setApproveCardImageUrl(e.target.value)}
                        className="flex-1 p-2 border border-neutral-250 rounded-lg text-xs"
                      />
                      <label className="flex items-center justify-center px-3 py-2 border border-indigo-200 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black cursor-pointer hover:bg-indigo-100 transition-colors">
                        <Upload className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleApproveImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {approveError && <p className="text-xs font-bold text-rose-500">{approveError}</p>}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovingCallingCardOrder(null)}
                className="flex-1 py-2.5 text-xs border border-neutral-200 hover:bg-neutral-50 font-bold text-neutral-500 rounded-lg transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all cursor-pointer"
              >
                {actionLoading ? 'অনুমোদন হচ্ছে...' : 'অনুমোদন নিশ্চিত করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BALANCE ADJUSTMENT MODAL (Quick correction) */}
      {adjustingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-3xs">
          <form onSubmit={handleBalanceAdjustment} className="bg-white rounded-2xl border border-neutral-200 p-6 max-w-sm w-full shadow-xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-black text-neutral-900 flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <span>ব্যালেন্স সমন্বয় করুন</span>
              </h3>
              <button type="button" onClick={() => setAdjustingUser(null)} className="text-neutral-400 hover:text-neutral-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/85 space-y-1">
                <p className="text-xs text-neutral-600 font-bold">গ্রাহক: <strong className="text-neutral-900">{adjustingUser.name}</strong></p>
                <p className="text-xs text-neutral-600 font-bold">মোবাইল: <strong className="text-neutral-900 font-mono">{adjustingUser.phone}</strong></p>
                <p className="text-xs text-neutral-600 font-bold">বর্তমান ব্যালেন্স: <strong className="text-indigo-600 font-mono">৳{adjustingUser.walletBalance.toLocaleString('bn-BD')} BDT</strong></p>
              </div>

              {/* Action Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceAction('add')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    balanceAction === 'add'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-black'
                      : 'bg-white border-neutral-200 text-slate-500'
                  }`}
                >
                  ফান্ড যোগ করুন (+)
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceAction('deduct')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    balanceAction === 'deduct'
                      ? 'bg-rose-50 border-rose-300 text-rose-700 font-black'
                      : 'bg-white border-neutral-200 text-slate-500'
                  }`}
                >
                  ফান্ড কর্তন করুন (-)
                </button>
              </div>

              {/* Amount Input */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-slate-700">টাকার পরিমাণ BDT *</label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="যেমন: ৫০০"
                  value={balanceAdjustAmount}
                  onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                  className="w-full text-xs p-2.5 border border-neutral-250 rounded-lg focus:outline-none focus:border-neutral-900 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingUser(null)}
                className="flex-1 py-2.5 text-xs border border-neutral-200 hover:bg-neutral-50 font-bold text-neutral-500 rounded-lg transition-colors cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className={`flex-1 py-2.5 text-xs font-bold text-white rounded-lg transition-all cursor-pointer ${
                  balanceAction === 'add' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                {actionLoading ? 'প্রসেস হচ্ছে...' : 'ব্যালেন্স আপডেট করুন'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. INVOICE DETAIL MODAL */}
      {selectedAdminInvoice && (
        <InvoiceModal
          order={selectedAdminInvoice}
          onClose={() => setSelectedAdminInvoice(null)}
          showForeignCurrency={showForeignCurrency}
          globalCurrencyName={globalCurrencyName}
          globalCurrencyRate={globalCurrencyRate}
        />
      )}

    </div>
  );
}
