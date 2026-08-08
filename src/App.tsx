import React, { useState, useEffect, useRef } from 'react';
import { 
  User as UserIcon, 
  Smartphone, 
  Home,
  Globe, 
  CreditCard, 
  Building2, 
  Lightbulb, 
  Coins, 
  Sparkles, 
  History, 
  LogOut, 
  ShieldAlert, 
  Send, 
  ArrowRight, ArrowRightLeft, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  SmartphoneNfc,
  Bell,
  Volume2,
  Plus,
  X,
  ChevronLeft,
  ChevronDown,
  UserPlus,
  Users,
  Search,
  Check,
  HelpCircle,
  FileText,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Printer,
  Sun,
  Moon,
  QrCode,
  Tv,
  Flame,
  Droplet,
  Phone,
  Wrench,
  Clock, Package, Receipt, ShoppingBag, Wifi, Activity, Shield, Fingerprint, Rocket, PhoneCall, AlertCircle
} from 'lucide-react';

import { motion } from 'motion/react';

import { User, Order, Offer, SupportTicket } from './types';
import MfsGateway from './components/MfsGateway';
import MfsTransferGateway from './components/MfsTransferGateway';
import BankingGateway from './components/BankingGateway';
import OfferList from './components/OfferList';
import AdminPanel from './components/AdminPanel';
import HelpSupport from './components/HelpSupport';
import ProfileSettings from './components/ProfileSettings';
import CallingCardView from './components/CallingCardView';
import AuthScreen from './components/AuthScreen';
import InteractiveVipCard from './components/InteractiveVipCard';
import PushNotificationModal from './components/PushNotificationModal';
import StatementModal from './components/StatementModal';
import { registerServiceWorker, showTransactionNotification } from './utils/serviceWorkerRegistration';
import { generateReceiptCanvas } from './utils/receiptGenerator';
import { captureCanvasSafely } from './utils/canvasHelper';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [lastTxnDetails, setLastTxnDetails] = useState<{
    invoiceNo: string;
    senderUsername: string;
    recipientPhone: string;
    amount: number;
    senderNewBalance: number;
    currentDateTime: string;
    method: 'bKash' | 'Nagad' | 'Rocket';
  } | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Premium Custom States
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [confettiActive, setConfettiActive] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);

  // Audio Play synthesizer helper using Web Audio API
  const playAudio = (type: 'click' | 'success' | 'popup' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'success') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (err) {
      console.warn('Audio Context blocked or not supported');
    }
  };
  
  // Navigation
  const [activePanel, setActivePanel] = useState<'dashboard' | 'mfs' | 'banking' | 'offers' | 'support' | 'profile' | 'admin' | 'mfs-transfer' | 'calling-card' | 'recharge'>('dashboard');
  const [mfsProvider, setMfsProvider] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [transferMfsProvider, setTransferMfsProvider] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'home' | 'history' | 'support' | 'wallet' | 'profile'>('home');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<'BN' | 'EN'>('BN');
  const [offersMode, setOffersMode] = useState<'drive' | 'internet'>('drive');

  // Maintenance Mode States
  const [maintenanceActive, setMaintenanceActive] = useState<boolean>(false);
  const [maintenanceReason, setMaintenanceReason] = useState<string>('');
  const [maintenanceHotlines, setMaintenanceHotlines] = useState<string[]>([]);
  const [marqueeSpeed, setMarqueeSpeed] = useState<number>(16);
  const [globalCurrencies, setGlobalCurrencies] = useState<any[]>([]);
  const [globalCurrencyName, setGlobalCurrencyName] = useState<string>(localStorage.getItem('shakib_currency_name') || 'USD');
  const [globalCurrencyRate, setGlobalCurrencyRate] = useState<number>(Number(localStorage.getItem('shakib_currency_rate')) || 120);
  const [showForeignCurrency, setShowForeignCurrency] = useState<boolean>(localStorage.getItem('shakib_show_currency') === 'true');
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('shakib_currency_name', globalCurrencyName);
    localStorage.setItem('shakib_currency_rate', globalCurrencyRate.toString());
    localStorage.setItem('shakib_show_currency', showForeignCurrency.toString());
  }, [globalCurrencyName, globalCurrencyRate, showForeignCurrency]);

  // Recharge State
  const [rechargePhone, setRechargePhone] = useState<string>('');
  const [rechargeOperator, setRechargeOperator] = useState<'Grameenphone' | 'Robi' | 'Airtel' | 'Teletalk' | 'Banglalink'>('Grameenphone');
  const [rechargeAmount, setRechargeAmount] = useState<string>('');
  const [rechargePin, setRechargePin] = useState<string>('');
  const [rechargeLoading, setRechargeLoading] = useState<boolean>(false);
  const [rechargeError, setRechargeError] = useState<string>('');
  const [rechargeSuccess, setRechargeSuccess] = useState<boolean>(false);

  // Send Money State (User to User)
  const [sendPhone, setSendPhone] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [sendPin, setSendPin] = useState<string>('');
  const [sendMethod, setSendMethod] = useState<string>('ShakibPay Wallet Balance');
  const [sendLoading, setSendLoading] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string>('');
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);

  // Utility Bill Payment State
  const [selectedUtility, setSelectedUtility] = useState<'Electricity' | 'Water' | 'Gas' | 'Internet' | 'Home Internet' | null>(null);
  const [utilityAccount, setUtilityAccount] = useState<string>('');
  const [utilityAmount, setUtilityAmount] = useState<string>('');
  const [utilityMonth, setUtilityMonth] = useState<string>('July 2026');
  const [utilityPin, setUtilityPin] = useState<string>('');
  const [utilityLoading, setUtilityLoading] = useState<boolean>(false);
  const [utilityError, setUtilityError] = useState<string>('');
  const [utilitySuccess, setUtilitySuccess] = useState<boolean>(false);

  // Sub-User Management State
  const [subUsers, setSubUsers] = useState<any[]>([
    { id: 'usr-1', name: 'Ayman Sadiq', phone: '01723456789', role: 'Retailer', balance: 1500, addedDate: '2026-07-25' },
    { id: 'usr-2', name: 'Nafis Fuad', phone: '01834567890', role: 'VIP', balance: 5200, addedDate: '2026-07-24' },
    { id: 'usr-3', name: 'Rifat Chowdhury', phone: '01945678901', role: 'Sub-Admin', balance: 12000, addedDate: '2026-07-23' }
  ]);

  const [viewingCallingCardDetails, setViewingCallingCardDetails] = useState<any | null>(null);
  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isMyUsersOpen, setIsMyUsersOpen] = useState(false);
  
  // Add User Form States
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRole, setAddRole] = useState<string>('Retailer');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [addPassword, setAddPassword] = useState('');
  const [addPin, setAddPin] = useState('');
  const [addBalance, setAddBalance] = useState('');
  const [addSuccessMsg, setAddSuccessMsg] = useState('');
  const [addErrorMsg, setAddErrorMsg] = useState('');

  // Transfer Fund State (My Users inside modal action)
  const [transferTargetPhone, setTransferTargetPhone] = useState('');
  const [transferTargetName, setTransferTargetName] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferPin, setTransferPin] = useState('');
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Search & Filter for History
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Add Money' | 'Recharge' | 'Send Money' | 'Utility Bill' | 'Drive Pack'>('all');
  const [historySearch, setHistorySearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState<boolean>(false);

  // Balance Reveal State
  const [balanceRevealed, setBalanceRevealed] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);

  // Dictionary of Translations
  const t = {
    BN: {
      appTitle: "SHAKIB PAY",
      balanceTap: "ব্যালেন্স দেখতে ট্যাপ করুন",
      balanceHide: "ব্যালেন্স লুকাতে ট্যাপ করুন",
      currentBalance: "চলতি ব্যালেন্স",
      resellerRole: "রিসেলার রোল",
      scrollingNotice: "আসসালামু আলাইকুম! SHAKIB PAY প্ল্যাটফর্মে আপনাকে স্বাগতম। কম রেটে ড্রাইভ প্যাক এবং নির্ভরযোগ্য অ্যাড মানি সুবিধা উপভোগ করুন।",
      addMoney: "অ্যাড মানি",
      sendMoney: "সেন্ড মানি",
      addUser: "অ্যাড ইউজার",
      myUsers: "মাই ইউজার্স",
      cashbackTitle: "প্রোমো ও ক্যাশব্যাক",
      servicesTitle: "রিচার্জ ও পেমেন্ট সেবাসমূহ",
      recharge: "মোবাইল রিচার্জ",
      drivePack: "ড্রাইভ প্যাক",
      regularPack: "রেগুলার প্যাক",
      history: "হিস্ট্রি ও খতিয়ান",
      mfsGateway: "MFS গেটওয়ে",
      bankTransfer: "ব্যাংক ট্রান্সফার",
      payBill: "ইউটিলিটি বিল",
      agent: "এজেন্ট",
      personal: "পার্সোনাল",
      vipParent: "ভিআইপি প্যারেন্ট",
      reseller: "রিসেলার",
      adminTitle: "এডমিন মোড",
      userMode: "ইউজার মোড",
      notifications: "নোটিফিকেশনস",
      activeTickets: "সক্রিয় সাপোর্ট টিকিট",
      supportDesk: "হেল্প ও কাস্টমার সাপোর্ট"
    },
    EN: {
      appTitle: "SHAKIB PAY",
      balanceTap: "Tap to view balance",
      balanceHide: "Tap to hide balance",
      currentBalance: "Current Balance",
      resellerRole: "Reseller Role",
      scrollingNotice: "Welcome to SHAKIB PAY! Enjoy premium discounted drive packs, utility bill pays & automated secure MFS add-money.",
      addMoney: "Add Money",
      sendMoney: "Send Money",
      addUser: "Add User",
      myUsers: "My Users",
      cashbackTitle: "Promos & Cashback",
      servicesTitle: "Recharge & Payment Services",
      recharge: "Mobile Recharge",
      drivePack: "Drive Pack",
      regularPack: "Regular Pack",
      history: "History Logs",
      mfsGateway: "MFS Gateway",
      bankTransfer: "Bank Transfer",
      payBill: "Pay Bill",
      agent: "Agent",
      personal: "Personal",
      vipParent: "VIP Parent",
      reseller: "Reseller",
      adminTitle: "Admin Mode",
      userMode: "User Mode",
      notifications: "Notifications",
      activeTickets: "Active Tickets",
      supportDesk: "Help & Customer Support"
    }
  };

  const [promoBanners, setPromoBanners] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [activePopup, setActivePopup] = useState<any | null>(null);
  const [popupShown, setPopupShown] = useState(false);
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);

  // References for tracking order status transitions for Service Worker Push Notifications
  const prevOrderStatusesRef = useRef<Record<string, string>>({});
  const isFirstOrderFetchRef = useRef(true);

  // Register Service Worker on initial mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Poll for Maintenance Mode Status
  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + `/api/maintenance?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setMaintenanceActive(!!data.active);
            setMaintenanceReason(data.reason || '');
            setMaintenanceHotlines(data.hotlines || []);
          }
        }
      } catch (e) {
        console.warn('Error fetching maintenance state:', e);
      }
    };
    fetchMaintenance();
    const interval = setInterval(fetchMaintenance, 6000);
    return () => clearInterval(interval);
  }, []);

  // Helper for safe JSON fetching
  const fetchJsonSafely = async (url: string) => {
    try {
      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        return await res.json();
      }
    } catch (e) {
      console.warn(`Fetch JSON error for ${url}:`, e);
    }
    return null;
  };

  // Fetch all state data
  const loadStateData = async (createdOrder?: any) => {
    try {
      // 1. Get Profile
      let uData: any = await fetchJsonSafely((import.meta.env.VITE_API_URL || '') + '/api/user/profile');
      if (uData) {
        setUser(uData);
      }

      // 2. Get Orders
      const oData = await fetchJsonSafely((import.meta.env.VITE_API_URL || '') + '/api/orders');
      if (oData && Array.isArray(oData)) {
        setOrders(oData);
        if (createdOrder) {
          const found = oData.find((o: any) => o.id === createdOrder.id);
          setSelectedInvoice(found || createdOrder);
        }

        // Service Worker Push Notification trigger on order status change
        if (isFirstOrderFetchRef.current) {
          oData.forEach((ord: any) => {
            prevOrderStatusesRef.current[ord.id] = ord.status;
          });
          isFirstOrderFetchRef.current = false;
        } else {
          oData.forEach((ord: any) => {
            const prevStatus = prevOrderStatusesRef.current[ord.id];
            const isPrevPending = prevStatus?.toUpperCase() === 'PENDING';
            const isCurrSuccess = ord.status?.toUpperCase() === 'SUCCESS';
            if (isPrevPending && isCurrSuccess) {
              showTransactionNotification({
                title: '🎉 ট্রানজেকশন সফল হয়েছে!',
                body: `আপনার ৳${ord.amount} টাকার ${ord.type || ord.serviceName || 'অর্ডার'} (#${ord.id}) সফলভাবে অনুমোদিত হয়েছে।`,
                orderId: ord.id,
                status: 'Success',
                type: ord.type
              });
              playAudio('success');

              // Visual in-app success popup triggered ONLY when order status changes to success!
              setActivePopup({
                id: `success-popup-${ord.id}`,
                title: '🎉 অর্ডার সফল হয়েছে!',
                body: `আপনার ৳${ord.amount} টাকার ${ord.type || ord.serviceName || 'অর্ডার'}টি (#${ord.id}) সফলভাবে সম্পন্ন হয়েছে।`,
                isOrderSuccessPopup: true,
                orderId: ord.id
              });
            } else if (isPrevPending && ['FAILED', 'REJECTED', 'CANCELLED'].includes(ord.status?.toUpperCase())) {
              showTransactionNotification({
                title: '❌ ট্রানজেকশন বাতিল হয়েছে',
                body: `আপনার ৳${ord.amount} টাকার ${ord.type || ord.serviceName || 'অর্ডার'} (#${ord.id}) বাতিল করা হয়েছে।`,
                orderId: ord.id,
                status: 'Failed',
                type: ord.type
              });
              playAudio('click');
            }
            prevOrderStatusesRef.current[ord.id] = ord.status;
          });
        }
      }

      // 3. Get Offers
      const fData = await fetchJsonSafely((import.meta.env.VITE_API_URL || '') + '/api/offers');
      if (fData && Array.isArray(fData)) {
        setOffers(fData);
      }

      // 4. Get Tickets
      const tData = await fetchJsonSafely((import.meta.env.VITE_API_URL || '') + '/api/tickets');
      if (tData && Array.isArray(tData)) {
        setTickets(tData);
      }

      // 5. Get All Users (for Admin Panel)
      const usersData = await fetchJsonSafely((import.meta.env.VITE_API_URL || '') + '/api/admin/users');
      if (usersData && Array.isArray(usersData)) {
        setAllUsers(usersData);
      }

      // 6. Get Services
      const servicesData = await fetchJsonSafely((import.meta.env.VITE_API_URL || '') + '/api/services');
      if (servicesData && Array.isArray(servicesData)) {
        setServices(servicesData);
      }

      // 7. Get Banners
      const bannersData = await fetchJsonSafely((import.meta.env.VITE_API_URL || '') + '/api/banners');
      if (bannersData && Array.isArray(bannersData)) {
        setPromoBanners(bannersData);
      }

      // 8. Get Notices
      const noticesData = await fetchJsonSafely((import.meta.env.VITE_API_URL || '') + '/api/notices');
      if (noticesData && Array.isArray(noticesData)) {
        setNotices(noticesData);
      }

      const siteConfigData = await fetchJsonSafely((import.meta.env.VITE_API_URL || '') + '/api/site-config');
      if (siteConfigData) {
        if (siteConfigData.speed) setMarqueeSpeed(siteConfigData.speed);
        if (siteConfigData.currencies && Array.isArray(siteConfigData.currencies)) {
          setGlobalCurrencies(siteConfigData.currencies);
          // Auto select first currency if none selected but available
          if (siteConfigData.currencies.length > 0 && !globalCurrencyName) {
            setGlobalCurrencyName(siteConfigData.currencies[0].name);
            setGlobalCurrencyRate(siteConfigData.currencies[0].rate);
          }
        }
      }

      // 9. Get Notifications
      const notificationsData = await fetchJsonSafely((import.meta.env.VITE_API_URL || '') + '/api/notifications');
      if (notificationsData && Array.isArray(notificationsData)) {
        setNotificationsList(notificationsData);

        // Auto trigger active popup on launch if matched role/phone and not expired
        const nowStr = new Date().toISOString().split('T')[0];
        const loggedInUser = uData || user;
        const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        const activeNotif = notificationsData.find((n: any) => {
          if (!n.isActive) return false;
          if (n.isPopupSeen) return false;
          if (dismissed.includes(n.id)) return false;
          if (n.targetPhone) {
            if (!loggedInUser || loggedInUser.phone !== n.targetPhone) return false;
          } else {
            const userRole = loggedInUser ? loggedInUser.role : 'Retailer';
            if (n.targetRole !== 'All' && n.targetRole !== userRole) return false;
          }
          if (n.expiryDate && n.expiryDate < nowStr) return false;
          return true;
        });
        if (activeNotif && !popupShown) {
          setActivePopup(activeNotif);
          setPopupShown(true);
        }
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadStateData();
  }, [activePanel]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      loadStateData();
    }, 8000);
    return () => clearInterval(interval);
  }, [user]);

  // Removed automatic admin mode redirect on boot to show the user dashboard in the preview by default.
  // Admins can toggle Admin Mode manually from the header button.

  useEffect(() => {
    if (isAddUserOpen && user) {
      const ROLE_HIERARCHY: Record<string, number> = {
        'Admin': 6,
        'Sub-Admin': 5,
        'Reseller': 4,
        'Dealer': 4,
        'Retailer': 3,
        'VIP': 2,
        'Normal User': 1,
        'User': 1
      };
      const userScore = ROLE_HIERARCHY[user.role] || 1;
      const allowed = Object.keys(ROLE_HIERARCHY).filter(r => {
        const score = ROLE_HIERARCHY[r];
        return score < userScore && r !== 'Dealer';
      });
      if (allowed.length > 0) {
        setAddRole(allowed[0]);
      }
    }
  }, [isAddUserOpen, user]);

  // Auto Scroll Banners
  useEffect(() => {
    if (promoBanners.length === 0) return;
    const slideTimer = setInterval(() => {
      setBannerIndex((prev) => {
        const nextIdx = (prev + 1) % promoBanners.length;
        return isNaN(nextIdx) ? 0 : nextIdx;
      });
    }, 4500);
    return () => clearInterval(slideTimer);
  }, [promoBanners.length]);

  // Balance tapping toggle
  const revealBalance = () => {
    if (!balanceRevealed) {
      setBalanceRevealed(true);
      const timer = setTimeout(() => {
        setBalanceRevealed(false);
      }, 4500);
      return () => clearTimeout(timer);
    } else {
      setBalanceRevealed(false);
    }
  };

  // Close active announcement popup and mark as dismissed in local storage and database
  const handleClosePopup = async () => {
    if (!activePopup) return;
    try {
      const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
      if (!dismissed.includes(activePopup.id)) {
        dismissed.push(activePopup.id);
        localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
      }

      // If this is a real notification, mark it as seen/isPopupSeen on the backend (Firestore) too!
      if (activePopup.id && !activePopup.isOrderSuccessPopup) {
        await fetch((import.meta.env.VITE_API_URL || '') + '/api/notifications/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: activePopup.id, isPopupSeen: true })
        });
      } else if (activePopup.orderId) {
        // Find any notification matching this orderId in notificationsList and update it in Firestore
        const matchingNotif = notificationsList.find((n: any) => n.body && n.body.includes(`#${activePopup.orderId}`));
        if (matchingNotif) {
          await fetch((import.meta.env.VITE_API_URL || '') + '/api/notifications/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: matchingNotif.id, isPopupSeen: true })
          });
        }
      }
    } catch (err) {
      console.error("Error updating notification status:", err);
    }
    setActivePopup(null);
  };

  // Mobile Recharge Submission handler
  const handleMobileRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setRechargeError('');
    setRechargeSuccess(false);

    if (!rechargePhone || rechargePhone.length < 11) {
      setRechargeError('সঠিক মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    const amt = Number(rechargeAmount);
    if (!rechargeAmount || isNaN(amt) || amt < 10) {
      setRechargeError('সর্বনিম্ন ১০ টাকা রিচার্জ করা যাবে।');
      return;
    }
    if (!rechargePin) {
      setRechargeError('সিকিউরিটি পিন প্রদান করুন।');
      return;
    }
    if (user && user.walletBalance < amt) {
      setRechargeError('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।');
      return;
    }

    setRechargeLoading(true);

    try {
      const receiptImg = await generateReceiptCanvas({
        type: 'Recharge',
        userName: user?.name || 'N/A',
        userPhone: user?.phone || 'N/A',
        serviceName: `${rechargeOperator} Recharge`,
        amount: amt,
        timestamp: new Date().toLocaleString('bn-BD'),
        targetNumber: rechargePhone
      , showForeignCurrency, globalCurrencyName, globalCurrencyRate });

      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Recharge',
          userPhone: user?.phone,
          serviceName: `${rechargeOperator} Recharge`,
          paymentMethod: 'Recharge',
          amount: amt,
          pin: rechargePin,
          receiptImage: receiptImg,
          recipientNumber: rechargePhone,
          operator: rechargeOperator,
          packDetails: `${rechargeOperator} Mobile Recharge`,
          userName: user?.name,
          userRole: user?.role
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'মোবাইল রিচার্জ প্রসেস করা যায়নি।');
      
      setRechargeSuccess(true);
      setRechargePhone('');
      setRechargeAmount('');
      setRechargePin('');
      loadStateData(data.order);
    } catch (err: any) {
      setRechargeError(err.message);
    } finally {
      setRechargeLoading(false);
    }
  };

  // Balance Send Money Submission handler
  const handleSendMoneySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    setSendSuccess(false);

    const cleanPhone = sendPhone.replace(/[\s\-\+\(\)]/g, "");
    if (!cleanPhone || cleanPhone.length < 11) {
      setSendError('সঠিক ১১-ডিজিটের টার্গেট মোবাইল নম্বর দিন।');
      return;
    }
    const amt = Number(sendAmount);
    if (!sendAmount || isNaN(amt) || amt <= 0) {
      setSendError('সঠিক স্থানান্তরের পরিমাণ লিখুন।');
      return;
    }
    if (!sendPin) {
      setSendError('সিকিউরিটি পিন প্রদান করুন।');
      return;
    }

    setSendLoading(true);

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/user/send-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: cleanPhone,
          amount: amt,
          pin: sendPin,
          method: sendMethod
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'টাকা স্থানান্তর সফল হয়নি।');

      // Generate invoice
      const senderUsernameStr = user?.email?.split('@')[0] || user?.name?.toLowerCase().replace(/\s+/g, '') || 'user';
      const formattedDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      setLastTxnDetails({
        invoiceNo: `SP-TXN-${Date.now()}`,
        senderUsername: senderUsernameStr,
        recipientPhone: sendPhone,
        amount: amt,
        senderNewBalance: data.balance ?? ((user?.walletBalance ?? 0) - amt),
        currentDateTime: formattedDate,
        method: sendMethod
      });

      setSendSuccess(true);
      setSendPhone('');
      setSendAmount('');
      setSendPin('');
      loadStateData();
      playAudio('success');

      // Close the main Send Money sheet after a brief moment or instantly, so receipt popup is shown
      setTimeout(() => {
        setIsSendMoneyOpen(false);
        setSendSuccess(false);
      }, 500);

    } catch (err: any) {
      setSendError(err.message);
      playAudio('error');
    } finally {
      setSendLoading(false);
    }
  };

  // Utility Bill Submission handler
  const handleUtilityBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUtility) return;

    setUtilityError('');
    setUtilitySuccess(false);

    if (!utilityAccount.trim()) {
      setUtilityError('বিলিং অ্যাকাউন্ট বা মিটার নম্বর লিখুন।');
      return;
    }
    const amt = Number(utilityAmount);
    if (!utilityAmount || isNaN(amt) || amt <= 0) {
      setUtilityError('সঠিক বিলের পরিমাণ লিখুন।');
      return;
    }
    if (!utilityPin) {
      setUtilityError('সিকিউরিটি পিন প্রদান করুন।');
      return;
    }

    setUtilityLoading(true);

    try {
      const receiptImg = await generateReceiptCanvas({
        type: 'Utility Bill',
        userName: user?.name || 'N/A',
        userPhone: user?.phone || 'N/A',
        serviceName: `${selectedUtility} Bill (${utilityMonth})`,
        amount: amt,
        timestamp: new Date().toLocaleString('bn-BD'),
        account: utilityAccount
      });

      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Utility Bill',
          userPhone: user?.phone || '',
          serviceName: `${selectedUtility} Bill (${utilityMonth})`,
          paymentMethod: 'Utility Bill',
          amount: amt,
          account: utilityAccount,
          pin: utilityPin,
          receiptImage: receiptImg,
          recipientNumber: utilityAccount,
          operator: selectedUtility,
          packDetails: `${selectedUtility} Bill (${utilityMonth})`,
          userName: user?.name,
          userRole: user?.role
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'বিল পেমেন্ট প্রসেস করা যায়নি।');

      setUtilitySuccess(true);
      setUtilityAccount('');
      setUtilityAmount('');
      setUtilityPin('');
      loadStateData(data.order);
    } catch (err: any) {
      setUtilityError(err.message);
    } finally {
      setUtilityLoading(false);
    }
  };

  // Add sub-user logic
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddErrorMsg('');
    setAddSuccessMsg('');

    if (!addName.trim()) { return setAddErrorMsg('ব্যবহারকারীর নাম লিখুন।'); }
    if (!addPhone || addPhone.length < 11) { return setAddErrorMsg('১১ ডিজিটের সঠিক মোবাইল নম্বর লিখুন।'); }
    if (!addPassword.trim()) { return setAddErrorMsg('পাসওয়ার্ড লিখুন।'); }
    if (!addPin || addPin.length !== 4) { return setAddErrorMsg('৪ ডিজিটের সিকিউরিটি পিন লিখুন।'); }
    
    const initialBal = Number(addBalance) || 0;
    if (initialBal > 0 && user && user.walletBalance < initialBal) {
      return setAddErrorMsg('নতুন ইউজারকে স্থানান্তর করার জন্য আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।');
    }

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addName,
          email: `${addPhone}@shakibpay.com`,
          phone: addPhone,
          role: addRole,
          password: addPassword,
          pin: addPin,
          initialBalance: initialBal
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ইউজার তৈরি করতে সমস্যা হয়েছে।');
      }

      setAddSuccessMsg('নতুন রিসেলার ইউজার সফলভাবে যুক্ত করা হয়েছে!');
      
      setAddName('');
      setAddPhone('');
      setAddPassword('');
      setAddPin('');
      setAddBalance('');
      loadStateData();
    } catch (err: any) {
      setAddErrorMsg(err.message);
    }
  };

  // Fund Transfer to sub-user logic
  const handleFundTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess(false);

    const amt = Number(transferAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      return setTransferError('সঠিক স্থানান্তরের পরিমাণ লিখুন।');
    }
    if (transferPin !== user?.pin) {
      return setTransferError('ভুল ওয়ালেট সিকিউরিটি পিন!');
    }
    if (user && user.walletBalance < amt) {
      return setTransferError('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!');
    }

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/user/send-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: transferTargetPhone,
          amount: amt,
          pin: transferPin
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ফান্ড স্থানান্তর করা যায়নি।');
      }

      setTransferSuccess(true);
      setTransferAmount('');
      setTransferPin('');
      loadStateData();
      setTimeout(() => {
        setIsTransferOpen(false);
        setTransferSuccess(false);
      }, 2000);
    } catch (err: any) {
      setTransferError(err.message);
    }
  };

  // Filtered orders list for History view
  const filteredOrders = orders.filter(order => {
    const matchesFilter = historyFilter === 'all' || order.type === historyFilter;
    const matchesSearch = !historySearch || 
      order.id.toLowerCase().includes(historySearch.toLowerCase()) ||
      order.serviceName.toLowerCase().includes(historySearch.toLowerCase()) ||
      order.userPhone.includes(historySearch) ||
      (order.trxId && order.trxId.toLowerCase().includes(historySearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="text-center space-y-6 relative z-10 animate-scale-up">
          {/* Wallet Safe Animation */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-indigo-500 to-cyan-500 w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/30 animate-bounce" style={{ animationDuration: '2s' }}>
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#0F172A] shadow-lg animate-pulse" style={{ animationDuration: '1.5s' }}>
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* Text Area */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">SHAKIB PAY</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase flex items-center justify-center">
              <span>সিকিউরড ওয়ালেট লোড হচ্ছে</span>
              <span className="flex space-x-0.5 ml-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAdminPath = ['/admin-url', '/admin', '/admin-url/', '/admin/'].includes(window.location.pathname);
  const isUserAdmin = user && user.role === 'Admin';

  if (maintenanceActive && !isUserAdmin && !isAdminPath) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#0A0E1A] to-[#0F172A] flex items-center justify-center text-white px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-md w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl backdrop-blur-md relative overflow-hidden text-left"
        >
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full -z-10" />

          {/* Icon Header with circular borders */}
          <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center mx-auto text-indigo-400 relative">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Wrench className="w-9 h-9" />
            </motion.div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2 text-center">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              সিস্টেম মেইনটেন্যান্স চলছে!
            </h2>
            <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">
              Under Scheduled Maintenance
            </p>
          </div>

          {/* Reason Card */}
          <div className="bg-slate-950/60 rounded-2xl border border-slate-850 p-4 space-y-2.5">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Clock className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider">এডমিন বার্তা / Admin Notice</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-semibold leading-relaxed">
              {maintenanceReason || "সিস্টেম আপগ্রেডেশন ও রক্ষণাবেক্ষণের কাজ চলছে। খুব দ্রুতই আমরা ফিরে আসব। আমাদের সাথে থাকার জন্য ধন্যবাদ।"}
            </p>
          </div>

          {/* Hotline / Helpline list */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                জরুরি প্রয়োজনে যোগাযোগ করুন / Contact Hotline
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {maintenanceHotlines.length > 0 ? (
                maintenanceHotlines.map((phone, idx) => (
                  <a
                    key={idx}
                    href={`tel:${phone}`}
                    className="flex items-center justify-between p-3.5 bg-slate-950/40 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all cursor-pointer hover:border-indigo-500/40"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-black tracking-widest font-mono text-slate-200">{phone}</span>
                    </div>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-1 rounded-lg border border-indigo-500/20">
                      CALL NOW
                    </span>
                  </a>
                ))
              ) : (
                <a
                  href="tel:01635275233"
                  className="flex items-center justify-between p-3.5 bg-slate-950/40 hover:bg-slate-850 border border-slate-800 rounded-xl transition-all cursor-pointer hover:border-indigo-500/40"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black tracking-widest font-mono text-slate-200">01635275233</span>
                  </div>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-extrabold px-2 py-1 rounded-lg border border-indigo-500/20">
                    CALL NOW
                  </span>
                </a>
              )}
            </div>
          </div>

          {/* Live Status Indicator & Admin Access */}
          <div className="pt-2 flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center space-x-2 bg-slate-950/80 border border-slate-850 px-3.5 py-1.5 rounded-full w-fit">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[9px] text-rose-400 font-black tracking-wider uppercase">সিস্টেম সাময়িকভাবে বন্ধ আছে</span>
            </div>

            {/* Hidden/Secret admin bypass portal */}
            <a 
              href="/admin-url" 
              className="text-[9px] text-slate-500 hover:text-indigo-400 transition-colors font-extrabold uppercase tracking-widest"
            >
              🔒 Admin Login Portal
            </a>
          </div>

        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen 
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          const isAdminPath = ['/admin-url', '/admin', '/admin-url/', '/admin/'].includes(window.location.pathname);
          if (loggedInUser.role === 'Admin' || isAdminPath) {
            setIsAdminMode(true);
            setActivePanel('admin');
          }
          loadStateData();
        }} 
        playAudio={playAudio} 
        isAdminLoginRoute={['/admin-url', '/admin', '/admin-url/', '/admin/'].includes(window.location.pathname)}
      />
    );
  }

  if (user && (user.status === 'Suspended' || user.status === 'Blocked')) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white px-6">
        <div className="max-w-md w-full bg-slate-900/80 border border-red-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-red-400">অ্যাকাউন্ট স্থগিত করা হয়েছে!</h2>
            <p className="text-xs text-red-400 font-extrabold uppercase tracking-wider">Account Suspended</p>
          </div>
          <p className="text-sm text-slate-300 font-bold leading-relaxed">
            Your account has been suspended. Please contact support.
          </p>
          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 text-left space-y-1.5">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase">ইউজার তথ্য (User Details)</p>
            <p className="text-xs font-bold text-slate-300">নাম: {user.name}</p>
            <p className="text-xs font-bold text-slate-300">মোবাইল: <span className="font-mono">{user.phone}</span></p>
          </div>
          <button
            onClick={async () => {
              await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/logout', { method: 'POST' });
              setUser(null);
            }}
            className="w-full py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-2 text-white"
          >
            <LogOut className="w-4 h-4" />
            <span>লগ আউট করুন (Logout)</span>
          </button>
        </div>
      </div>
    );
  }

  // Active panel switching with tab highlighting helper
  const handleTabClick = (tab: 'home' | 'history' | 'support' | 'wallet' | 'profile') => {
    setCurrentTab(tab);
    setIsAdminMode(false);
    if (tab === 'home') setActivePanel('dashboard');
    else if (tab === 'support') setActivePanel('support');
    else if (tab === 'profile') setActivePanel('profile');
    else if (tab === 'history') setActivePanel('dashboard');
    else if (tab === 'wallet') setActivePanel('dashboard');
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 6) return { text: language === 'BN' ? '☀️ শুভ ভোর' : '☀️ Good Dawn', sub: language === 'BN' ? 'আজকের দিনটি শুভ হোক!' : 'Have a productive day!' };
    if (hr >= 6 && hr < 12) return { text: language === 'BN' ? '🌅 শুভ সকাল' : '🌅 Good Morning', sub: language === 'BN' ? 'আজকের দিনটি শুভ হোক!' : 'Have a productive day!' };
    if (hr >= 12 && hr < 17) return { text: language === 'BN' ? '☀️ শুভ দুপুর' : '☀️ Good Afternoon', sub: language === 'BN' ? 'আপনার ট্রানজেকশন সফল হোক!' : 'Have a productive day!' };
    if (hr >= 17 && hr < 21) return { text: language === 'BN' ? '🌆 শুভ সন্ধ্যা' : '🌆 Good Evening', sub: language === 'BN' ? 'আমাদের সাথে থাকার জন্য ধন্যবাদ!' : 'Have a productive day!' };
    return { text: language === 'BN' ? '🌙 শুভ রাত্রি' : '🌙 Good Night', sub: language === 'BN' ? 'সুস্থ থাকুন, নিরাপদে থাকুন!' : 'Have a productive day!' };
  };

  // Dynamic Service icon renderer with dynamic / custom uploaded icon support
  const renderServiceIcon = (slug: string, FallbackIcon: React.ComponentType<any>, colorClass: string) => {
    const matchedService = services.find(s => s.slug === slug);
    if (matchedService && matchedService.icon) {
      return (
        <div className="w-9 h-9 rounded-lg overflow-hidden border border-neutral-150 bg-white flex items-center justify-center shrink-0 shadow-4xs">
          <img src={matchedService.icon} alt={matchedService.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border border-neutral-100 ${colorClass} shrink-0 shadow-4xs`}>
        <FallbackIcon className="w-4.5 h-4.5" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-neutral-800 font-sans leading-relaxed selection:bg-indigo-600 selection:text-white flex justify-center items-start sm:py-6 relative overflow-x-hidden">
      
      {/* KEYFRAMES FOR MARQUEE */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 16s linear infinite;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* PHONE WRAPPER SIMULATOR FRAME */}
      <div className={`w-full min-h-screen sm:min-h-[850px] sm:rounded-[48px] overflow-y-auto shadow-2xl relative flex flex-col pb-24 border-[8px] border-neutral-900 scrollbar-none transition-all duration-300 ${
        theme === 'dark' 
          ? 'bg-[#0B0F19] text-slate-100' 
          : 'bg-[#F8FAFC] text-neutral-800'
      } ${
        isAdminMode && activePanel === 'admin'
          ? 'max-w-6xl sm:max-h-[960px]'
          : 'max-w-[430px] sm:max-h-[920px]'
      }`} id="phone-container">
        
        {/* PHONE NOTCH & TIME (only visible on sm screen and up) */}
        <div className="hidden sm:flex justify-between items-center px-6 py-2 bg-neutral-950 text-white rounded-t-[36px] text-[10px] font-black z-30 tracking-tight shrink-0 sticky top-0">
          <span>9:41</span>
          <div className="w-24 h-4 bg-black rounded-full flex items-center justify-center relative">
            <div className="w-2 h-2 rounded-full bg-neutral-800 absolute right-4"></div>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[8px] text-emerald-400">5G</span>
            <div className="w-5 h-2.5 bg-white/20 rounded-xs flex p-0.5 items-stretch">
              <div className="w-3 bg-white rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* TOP APP BAR HEADER */}
        <div className={`p-4 flex items-center justify-between shrink-0 sticky top-0 sm:top-0 z-20 shadow-lg backdrop-blur-md transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-[#0B0F19]/95 border-b border-slate-800/80 text-slate-100' 
            : 'bg-[#F8FAFC]/95 border-b border-neutral-200/80 text-neutral-800'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="relative group cursor-pointer" onClick={() => handleTabClick('profile')}>
              <img
                src={user.profilePic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"}
                alt={user.name}
                referrerPolicy="no-referrer"
                className={`w-12 h-12 rounded-full object-cover border-2 shadow-md transition-transform duration-300 group-hover:scale-105 ${
                  theme === 'dark' ? 'border-indigo-500/30' : 'border-indigo-200'
                }`}
              />
            </div>
            <div className="text-left space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className={`text-[15px] font-black tracking-tight leading-none ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                  Hi, {user.name} 👋
                </span>
              </div>
              <span className={`text-[11px] block font-bold leading-none ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
                Welcome back!
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Search Button */}
            <button
              className={`p-2 rounded-full transition-all border ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800' 
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Notification bell with notch dot */}
            <button 
              onClick={() => {
                setIsPushModalOpen(true);
                playAudio('click');
              }}
              className={`relative p-2 rounded-full transition-all border ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800' 
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Bell className="w-4.5 h-4.5" />
              <span className={`absolute top-0 right-0 flex h-4 w-4 items-center justify-center bg-rose-500 rounded-full border-2 text-[8px] font-bold text-white ${theme === 'dark' ? 'border-[#0B0F19]' : 'border-[#F8FAFC]'}`}>3</span>
            </button>

            {/* QR Scan button (Violet square) */}
            <button
              onClick={() => {
                playAudio('click');
                alert(language === 'BN' ? 'কিউআর কোড স্ক্যানার সক্রিয় করা হচ্ছে...' : 'Initializing Secure QR Code Reader...');
              }}
              className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all flex items-center justify-center text-white shadow-md shadow-violet-900/30"
              title="Scan QR Code"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* ADMIN MAINTENANCE BANNER */}
        {maintenanceActive && isUserAdmin && (
          <div className={`mx-4 mt-4 mb-2 p-3 rounded-2xl flex items-center justify-between border ${theme === 'dark' ? 'bg-[#1E1420] border-[#3B1C28]' : 'bg-rose-50 border-rose-100'}`}>
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-[#2A1724]' : 'bg-rose-100'}`}>
                <Wrench className={`w-4 h-4 ${theme === 'dark' ? 'text-rose-500' : 'text-rose-600'}`} />
              </div>
              <div className="text-left leading-tight">
                <div className={`text-[11px] font-black tracking-wider uppercase ${theme === 'dark' ? 'text-rose-500' : 'text-rose-600'}`}>
                  MAINTENANCE MODE IS ON.
                </div>
                <div className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-rose-900/60'}`}>
                  Normal users are blocked. You are viewing as admin.
                </div>
              </div>
            </div>
            <button 
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${theme === 'dark' ? 'bg-[#2A1724] border-[#3B1C28] text-rose-500 hover:bg-[#321B2C]' : 'bg-rose-100 border-rose-200 text-rose-700 hover:bg-rose-200'}`}
              onClick={() => {
                setActivePanel('admin');
                setCurrentTab('maintenance_control');
              }}
            >
              View Details
            </button>
          </div>
        )}

        {/* TOP SCROLLING NOTICE BAR */}
        {(() => {
          const activeNotices = notices.filter(n => n.isActive !== false);
          if (activeNotices.length === 0) return null;
          const firstNotice = activeNotices[0];
          return (
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center space-x-2 text-amber-800 text-[10px] shrink-0 overflow-hidden whitespace-nowrap z-10">
              <Volume2 className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
              <div className="w-full overflow-hidden relative h-3.5">
                <span 
                  key={marqueeSpeed} className="absolute inline-block animate-marquee whitespace-nowrap font-bold"
                  style={{ color: firstNotice.textColor || '#B45309', animationDuration: `${marqueeSpeed}s` }}
                >
                  {firstNotice.text}
                </span>
              </div>
            </div>
          );
        })()}

        {/* MAIN BODY AREA */}
        <div className="p-4 flex-1">
          
          {/* 1. ADMIN PANEL VIEW */}
          {isAdminMode && activePanel === 'admin' ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                <div>
                  <h2 className="text-sm font-black text-neutral-900">এডমিন ব্যাক অফিস</h2>
                  <p className="text-[9px] text-neutral-400">অর্ডার অনুমোদন ও অফার ম্যানেজমেন্ট</p>
                </div>
                <span className="bg-neutral-950 text-white text-[8px] font-extrabold px-2 py-0.5 rounded tracking-widest uppercase">PORTAL</span>
              </div>
              <AdminPanel 
                orders={orders} 
                offers={offers} 
                tickets={tickets} 
                users={allUsers}
                onRefresh={loadStateData} 
                showForeignCurrency={showForeignCurrency}
                globalCurrencyName={globalCurrencyName}
                globalCurrencyRate={globalCurrencyRate}
                onLogout={async () => {
                  playAudio('click');
                  try {
                    await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/logout', { method: 'POST' });
                  } catch (err) {
                    console.error('Logout error:', err);
                  }
                  setUser(null);
                  setIsAdminMode(false);
                  setActivePanel('dashboard');
                  setCurrentTab('home');
                  window.history.replaceState({}, '', '/');
                }}
              />
            </div>
          ) : (
            /* USER TABS PANEL SWITCHER */
            <div>
              
              {/* === DASHBOARD TAB VIEW === */}
              {activePanel === 'dashboard' && currentTab === 'home' && (
                <div className="space-y-4">
                  
                  {/* Section 2: 3D Holographic VIP Member Card */}
                  <div className="relative">
                    <InteractiveVipCard 
                      user={user}
                      language={language}
                      balanceRevealed={balanceRevealed}
                      onRevealToggle={revealBalance}
                      playAudio={playAudio}
                      currencyName={globalCurrencyName}
                      currencyRate={globalCurrencyRate}
                      onCurrencyClick={() => setIsCurrencyModalOpen(true)}
                      showForeignCurrency={showForeignCurrency}
                    />
                  </div>

                                    {/* --- NEW GRID & SECTIONS MATCHING SCREENSHOT --- */}
                  
                  {/* MAIN 8-BUTTON GRID */}
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    {(() => {
                      // Filter services for Main Grid and sort by sortOrder
                      let mainServices = services.filter(s => s.type === 'Main Grid').sort((a,b) => a.sortOrder - b.sortOrder);
                      // Fallback if no services are assigned to Main Grid
                      if (mainServices.length === 0) {
                        mainServices = [
                          { id: 'm1', name: 'Add Money', slug: 'add_money', isEnabled: true, icon: '', type: 'Main Grid', sortOrder: 1, rateMultiplier: 1, country: 'BD' },
                          { id: 'm2', name: 'Send Money', slug: 'send_money', isEnabled: true, icon: '', type: 'Main Grid', sortOrder: 2, rateMultiplier: 1, country: 'BD' },
                          { id: 'm3', name: 'Drive Pack', slug: 'drive', isEnabled: true, icon: '', type: 'Main Grid', sortOrder: 3, rateMultiplier: 1, country: 'BD' },
                          { id: 'm4', name: 'Recharge', slug: 'recharge', isEnabled: true, icon: '', type: 'Main Grid', sortOrder: 4, rateMultiplier: 1, country: 'BD' },
                          { id: 'm5', name: 'Pay Bill', slug: 'bill', isEnabled: true, icon: '', type: 'Main Grid', sortOrder: 5, rateMultiplier: 1, country: 'BD' },
                          { id: 'm6', name: 'Banking', slug: 'banking', isEnabled: true, icon: '', type: 'Main Grid', sortOrder: 6, rateMultiplier: 1, country: 'BD' },
                          { id: 'm7', name: 'Calling Card', slug: 'calling_card', isEnabled: true, icon: '', type: 'Main Grid', sortOrder: 7, rateMultiplier: 1, country: 'BD' },
                          { id: 'm8', name: 'Make Agent', slug: 'make_agent', isEnabled: true, icon: '', type: 'Main Grid', sortOrder: 8, rateMultiplier: 1, country: 'BD' },
                        ];
                      }
                      
                      return mainServices.map((serv, idx) => {
                        let IconComponent = ShoppingBag;
                        let colorClass = "bg-amber-500 shadow-amber-500/20";
                        let action = () => {};
                        
                        if (serv.slug === 'add_money') { IconComponent = Plus; colorClass = "bg-emerald-500 shadow-emerald-500/20"; action = () => { setMfsProvider('bkash'); setActivePanel('mfs'); }; }
                        else if (serv.slug === 'send_money') { IconComponent = Send; colorClass = "bg-violet-600 shadow-violet-600/20"; action = () => setIsSendMoneyOpen(true); }
                        else if (serv.slug === 'drive') { IconComponent = Package; colorClass = "bg-orange-500 shadow-orange-500/20"; action = () => { setOffersMode('drive'); setActivePanel('offers'); }; }
                        else if (serv.slug === 'recharge') { IconComponent = Smartphone; colorClass = "bg-blue-500 shadow-blue-500/20"; action = () => setActivePanel('recharge'); }
                        else if (serv.slug === 'bill') { IconComponent = Receipt; colorClass = "bg-rose-500 shadow-rose-500/20"; action = () => { setSelectedUtility('Electricity'); const el = document.getElementById('utility-card'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }; }
                        else if (serv.slug === 'banking') { IconComponent = Building2; colorClass = "bg-indigo-600 shadow-indigo-600/20"; action = () => setActivePanel('banking'); }
                        else if (serv.slug === 'make_agent') { IconComponent = Users; colorClass = "bg-teal-500 shadow-teal-500/20"; action = () => setIsAddUserOpen(true); }
                        else if (serv.slug === 'ecommerce') { IconComponent = ShoppingBag; colorClass = "bg-amber-500 shadow-amber-500/20"; action = () => {}; }
                        else if (serv.slug === 'calling_card') { IconComponent = PhoneCall; colorClass = "bg-rose-500 shadow-rose-500/20"; action = () => setActivePanel('calling-card'); }
                        else {
                           IconComponent = Sparkles; // fallback
                           colorClass = "bg-indigo-500 shadow-indigo-500/20";
                        }
                        
                        return (
                          <button
                            key={serv.id || idx}
                            type="button"
                            onClick={() => { if (!serv.isEnabled) { alert('Temporary unavailable please contact helpline'); } else { action(); playAudio('click'); } }}
                            className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer active:scale-95 ${!serv.isEnabled ? 'opacity-60 grayscale' : ''} ${
                              theme === 'dark' 
                                ? 'bg-[#141A28] border-slate-800/60 hover:bg-slate-800/80 shadow-md shadow-slate-900/50' 
                                : 'bg-white border-neutral-100 hover:bg-neutral-50 shadow-sm'
                            }`}
                          >
                            <div className={`w-12 h-10 rounded-xl flex items-center justify-center mb-2 shadow-md ${colorClass}`}>
                              {serv.icon ? (
                                <img src={serv.icon} alt={serv.name} className="w-6 h-6 object-contain" />
                              ) : (
                                <IconComponent className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <span className={`text-[10px] font-black tracking-tight text-center leading-tight ${
                              theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'
                            }`}>{serv.name}</span>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* PROMO BANNER / SLIDER */}
                  {promoBanners.length > 0 ? (
                    <div 
                      key={promoBanners[bannerIndex]?.id}
                      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${promoBanners[bannerIndex]?.color || 'from-indigo-700 via-purple-700 to-indigo-800'} text-white shadow-lg p-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all duration-500 animate-fade-in`} 
                      onClick={() => { setActivePanel(promoBanners[bannerIndex]?.action || 'offers'); playAudio('click'); }}
                    >
                      <div className="absolute right-0 top-0 w-32 h-full opacity-20 pointer-events-none">
                         <Wifi className="w-full h-full text-white" strokeWidth={0.5} />
                      </div>
                      <div className="space-y-2 relative z-10 text-left flex-1">
                        <h3 className="text-[17px] font-black leading-tight drop-shadow-md">{promoBanners[bannerIndex]?.title}</h3>
                        <p className="text-[11px] font-bold text-white/80 drop-shadow-sm line-clamp-2">{promoBanners[bannerIndex]?.desc}</p>
                        <button className="mt-1 px-4 py-1.5 bg-black/20 hover:bg-black/30 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-colors">
                          <span>এখনই দেখুন</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {promoBanners[bannerIndex]?.image ? (
                        <div className="relative z-10 w-20 h-20 ml-4 bg-black/10 rounded-xl overflow-hidden shadow-md border border-white/20 shrink-0">
                          <img src={promoBanners[bannerIndex].image} alt="Promo" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="relative z-10 w-20 h-20 ml-4 bg-black/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shrink-0">
                          <Wifi className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white shadow-lg p-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform" onClick={() => { setOffersMode('internet'); setActivePanel('offers'); playAudio('click'); }}>
                      <div className="absolute right-0 top-0 w-32 h-full opacity-20 pointer-events-none">
                         <Wifi className="w-full h-full text-white" strokeWidth={0.5} />
                      </div>
                      <div className="space-y-2 relative z-10 text-left">
                        <h3 className="text-[17px] font-black leading-tight drop-shadow-md">ইন্টারনেট প্যাকেজ কিনুন</h3>
                        <p className="text-[11px] font-bold text-indigo-100 drop-shadow-sm">সেরা অফারে – দ্রুত, সহজ ও নিরাপদ</p>
                        <button className="mt-1 px-4 py-1.5 bg-indigo-900/50 hover:bg-indigo-900/70 border border-indigo-400/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-colors">
                          <span>এখনই কিনুন</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="relative z-10 w-20 h-20 bg-indigo-500/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-indigo-400/20">
                        <Wifi className="w-10 h-10 text-white" />
                      </div>
                    </div>
                  )}

                  {/* MOBILE BANKING ROW */}
                  <div className="text-left pt-2">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>Mobile Banking</h3>
                      <button className={`text-[11px] font-bold flex items-center space-x-0.5 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
                        <span>See All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex space-x-3 overflow-x-auto scrollbar-none pb-2">
                      {(() => {
                        let mfsServices = services.filter(s => s.type === 'Mobile Bank').sort((a,b) => a.sortOrder - b.sortOrder);
                        
                        return mfsServices.map((item, idx) => {
                          let IconComponent = Wallet;
                          let iconColor = 'text-slate-500';
                          let codeParam = 'more';
                          
                          if (item.slug === 'bkash') { IconComponent = Coins; iconColor = 'text-pink-600'; codeParam = 'bkash'; }
                          else if (item.slug === 'nagad') { IconComponent = Flame; iconColor = 'text-orange-500'; codeParam = 'nagad'; }
                          else if (item.slug === 'rocket') { IconComponent = Rocket; iconColor = 'text-purple-600'; codeParam = 'rocket'; }
                          else if (item.slug === 'upay') { IconComponent = Activity; iconColor = 'text-amber-500'; codeParam = 'upay'; }
                          else if (item.slug === 'selfin') { IconComponent = Shield; iconColor = 'text-teal-600'; codeParam = 'more'; }
                          else if (item.slug === 'mcash') { IconComponent = Wallet; iconColor = 'text-green-600'; codeParam = 'more'; }
                          else if (item.slug === 'surecash') { IconComponent = CreditCard; iconColor = 'text-emerald-500'; codeParam = 'more'; }
                          else if (item.slug === 'tap') { IconComponent = Fingerprint; iconColor = 'text-cyan-600'; codeParam = 'more'; }
                          else { IconComponent = Coins; iconColor = 'text-indigo-500'; codeParam = 'more'; }
                          
                          return (
                            <button key={item.id || idx} className={`flex flex-col items-center flex-shrink-0 space-y-1.5 cursor-pointer active:scale-95 transition-transform ${!item.isEnabled ? 'opacity-60 grayscale' : ''}`} onClick={() => { if (!item.isEnabled) { alert('Temporary unavailable please contact helpline'); } else { setTransferMfsProvider(codeParam === 'more' ? null : codeParam); setActivePanel('mfs-transfer'); playAudio('click'); } }}>
                              <div className="w-14 h-12 bg-white rounded-xl shadow-sm border border-neutral-150 flex items-center justify-center overflow-hidden p-1">
                                {item.icon ? (
                                  <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
                                ) : (
                                  <IconComponent className={`w-6 h-6 ${iconColor}`} />
                                )}
                              </div>
                              <span className={`text-[10px] font-black ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}`}>{item.name}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* TODAY'S SUMMARY */}
                  <div className="text-left pt-2">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>আজকের সারাংশ</h3>
                      <button onClick={() => { handleTabClick('history'); }} className={`text-[11px] font-bold flex items-center space-x-0.5 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
                        <span>All Stats</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-2xl border flex flex-col justify-between space-y-3 ${theme === 'dark' ? 'bg-[#141A28] border-[#1D253B] shadow-lg shadow-[#141A28]/50' : 'bg-white border-neutral-150 shadow-sm'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                          <Wallet className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <div>
                          <p className={`text-[10px] font-bold mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>Total Balance</p>
                          <p className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>৳ {user.walletBalance.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-2xl border flex flex-col justify-between space-y-3 ${theme === 'dark' ? 'bg-[#141A28] border-[#1D253B] shadow-lg shadow-[#141A28]/50' : 'bg-white border-neutral-150 shadow-sm'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                          <ArrowRightLeft className={`w-4 h-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </div>
                        <div>
                          <p className={`text-[10px] font-bold mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>Today's Trans</p>
                          <p className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>৳ {orders.filter(o => new Date(o.date).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + (o.amount||0), 0).toLocaleString('bn-BD', {minimumFractionDigits: 0}) || '0'}</p>
                        </div>
                      </div>

                      <div className={`p-3 rounded-2xl border flex flex-col justify-between space-y-3 ${theme === 'dark' ? 'bg-[#141A28] border-[#1D253B] shadow-lg shadow-[#141A28]/50' : 'bg-white border-neutral-150 shadow-sm'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-50'}`}>
                          <Users className={`w-4 h-4 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
                        </div>
                        <div>
                          <p className={`text-[10px] font-bold mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>Total Users</p>
                          <p className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{allUsers.length}</p>
                        </div>
                      </div>

                      <div className={`p-3 rounded-2xl border flex flex-col justify-between space-y-3 ${theme === 'dark' ? 'bg-[#141A28] border-[#1D253B] shadow-lg shadow-[#141A28]/50' : 'bg-white border-neutral-150 shadow-sm'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                          <CheckCircle2 className={`w-4 h-4 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                        <div>
                          <p className={`text-[10px] font-bold mb-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>Successful Trx</p>
                          <p className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{orders.length > 0 ? Math.round((orders.filter(o => o.status === 'Success').length / orders.length) * 100) : 0}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUICK ACCESS */}
                  <div className="text-left pt-2 pb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={`text-sm font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>দ্রুত অ্যাক্সেস</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Add Balance", icon: Plus, color: "text-emerald-500", action: () => { setMfsProvider('bkash'); setActivePanel('mfs'); } },
                        { label: "Send Money", icon: Send, color: "text-violet-500", action: () => setIsSendMoneyOpen(true) },
                        { label: "Recharge", icon: Smartphone, color: "text-blue-500", action: () => setActivePanel('recharge') },
                        { label: "Pay Bill", icon: Receipt, color: "text-rose-500", action: () => { setSelectedUtility('Electricity'); const el = document.getElementById('utility-card'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } }
                      ].map((act, idx) => {
                        const Icon = act.icon || (() => <span />);
                        return (
                          <button 
                            key={idx}
                            onClick={() => { act.action(); playAudio('click'); }}
                            className={`flex items-center space-x-1.5 p-2.5 rounded-xl border transition-colors active:scale-95 ${
                              theme === 'dark' ? 'bg-[#141A28] border-[#1D253B] hover:bg-[#1D253B]' : 'bg-white border-neutral-200 hover:bg-neutral-50'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${act.color}`} />
                            <span className={`text-[10px] font-black whitespace-nowrap overflow-hidden text-ellipsis ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}`}>{act.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* UTILITY BILL SECTION */}
                  {selectedUtility && (
                    <div id="utility-card" className={`p-4 rounded-2xl border text-left ${theme === 'dark' ? 'bg-[#141A28] border-[#1D253B]' : 'bg-white border-neutral-100'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className={`text-sm font-black tracking-tight flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                          <Receipt className="w-4 h-4 text-rose-500" />
                          Utility Bill Payment
                        </h3>
                        <button onClick={() => setSelectedUtility(null)} className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-neutral-100'}`}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {utilitySuccess && (
                        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">আপনার বিল পেমেন্ট রিকুয়েস্ট সফলভাবে গ্রহণ করা হয়েছে।</p>
                        </div>
                      )}

                      {utilityError && (
                        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                          <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{utilityError}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {[
                          { key: 'Electricity', label: 'বিদ্যুৎ' },
                          { key: 'Water', label: 'পানি' },
                          { key: 'Gas', label: 'গ্যাস' },
                          { key: 'Internet', label: 'ইন্টারনেট' },
                          { key: 'Home Internet', label: 'হোম ইন্টারনেট' }
                        ].map(util => (
                          <button
                            key={util.key}
                            onClick={() => setSelectedUtility(util.key as any)}
                            className={`p-2 rounded-xl border text-[10px] font-black transition-all ${selectedUtility === util.key ? (theme === 'dark' ? 'bg-rose-500 text-white border-rose-500' : 'bg-rose-500 text-white border-rose-500') : (theme === 'dark' ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-neutral-50 text-neutral-500 border-neutral-200')}`}
                          >
                            {util.label}
                          </button>
                        ))}
                      </div>

                      <form onSubmit={handleUtilityBillSubmit} className="space-y-3">
                        <div>
                          <label className={`block text-[10px] font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
                            বিলিং অ্যাকাউন্ট / মিটার নম্বর
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="একাউন্ট নম্বর দিন"
                            value={utilityAccount}
                            onChange={(e) => setUtilityAccount(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${
                              theme === 'dark' 
                                ? 'bg-slate-900/50 border-slate-800 text-white placeholder-slate-600' 
                                : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-[10px] font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
                              বিলের পরিমাণ
                            </label>
                            <input
                              type="number"
                              required
                              placeholder="৳ 0.00"
                              value={utilityAmount}
                              onChange={(e) => setUtilityAmount(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${
                                theme === 'dark' 
                                  ? 'bg-slate-900/50 border-slate-800 text-white placeholder-slate-600' 
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block text-[10px] font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
                              বিলের মাস
                            </label>
                            <input
                              type="text"
                              value={utilityMonth}
                              onChange={(e) => setUtilityMonth(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${
                                theme === 'dark' 
                                  ? 'bg-slate-900/50 border-slate-800 text-white' 
                                  : 'bg-neutral-50 border-neutral-200 text-neutral-900'
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block text-[10px] font-bold mb-1 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
                            আপনার পিন নম্বর
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="****"
                            maxLength={4}
                            value={utilityPin}
                            onChange={(e) => setUtilityPin(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl border text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500/50 ${
                              theme === 'dark' 
                                ? 'bg-slate-900/50 border-slate-800 text-white placeholder-slate-600' 
                                : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
                            }`}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={utilityLoading}
                          className="w-full mt-2 bg-rose-500 hover:bg-rose-600 text-white font-black py-3 rounded-xl shadow-lg shadow-rose-500/30 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                          {utilityLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Receipt className="w-4 h-4" />
                              বিল পরিশোধ করুন
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
{/* === WALLET TAB VIEW === */}
              {activePanel === 'dashboard' && currentTab === 'wallet' && (
                <div className="space-y-4 text-left">
                  <div className={`border-b pb-2 ${theme === 'dark' ? 'border-slate-800/80' : 'border-neutral-100'}`}>
                    <h2 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>আমার ওয়ালেট হাব</h2>
                    <p className={`text-[9px] ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>ব্যালেন্স লোড, টাকা পাঠান এবং কমিশন স্ট্যাটিসটিক্স</p>
                  </div>

                  {/* Wallet overview card */}
                  <div className={`rounded-2xl p-5 shadow-lg relative overflow-hidden space-y-4 border ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-tr from-slate-900 via-slate-900 to-[#1e293b] border-slate-800' 
                      : 'bg-gradient-to-tr from-indigo-600 via-indigo-700 to-indigo-850 border-indigo-700 text-white shadow-md shadow-indigo-600/10'
                  }`}>
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-xl z-0"></div>
                    <div className="flex justify-between items-center relative z-10">
                      <span className="text-[8px] bg-indigo-600/90 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">ACTIVE WALLET BDT</span>
                      <span className={`text-[9px] font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>Commission Active</span>
                    </div>

                    <div className="space-y-1 relative z-10">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>মোট চলতি ব্যালেন্স</p>
                      <h3 className="text-2xl font-black font-mono tracking-wider text-cyan-400">৳{user.walletBalance.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} BDT</h3>
                    </div>

                    {/* Stats columns */}
                    <div className={`grid grid-cols-2 gap-4 pt-3 border-t relative z-10 ${theme === 'dark' ? 'border-slate-800' : 'border-neutral-800'}`}>
                      {(() => {
                        const totalIn = orders
                          .filter((o: any) => o.status === 'Success' && (o.type === 'Add Money' || o.type === 'Deposit' || o.type === 'Bank Deposit') && (o.userPhone === user.phone || o.userEmail === user.email))
                          .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

                        const totalOut = orders
                          .filter((o: any) => o.status === 'Success' && o.type !== 'Add Money' && o.type !== 'Deposit' && o.type !== 'Bank Deposit' && (o.userPhone === user.phone || o.userEmail === user.email))
                          .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

                        return (
                          <>
                            <div>
                              <div className="flex items-center space-x-1 text-emerald-400">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-black uppercase tracking-wider">টোটাল ইন (ইনস্ট্যান্ট)</span>
                              </div>
                              <p className={`text-xs font-bold font-mono mt-0.5 ${theme === 'dark' ? 'text-slate-100' : 'text-white/95'}`}>
                                ৳{totalIn.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} BDT
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center space-x-1 text-rose-400">
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-black uppercase tracking-wider">টোটাল আউট (ব্যয়িত)</span>
                              </div>
                              <p className={`text-xs font-bold font-mono mt-0.5 ${theme === 'dark' ? 'text-slate-100' : 'text-white/95'}`}>
                                ৳{totalOut.toLocaleString('bn-BD', { minimumFractionDigits: 2 })} BDT
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Level commission breakdown card */}
                  <div className={`p-4 rounded-2xl border shadow-4xs space-y-3 ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-neutral-100'
                  }`}>
                    <span className={`text-[8px] border px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider inline-block ${
                      theme === 'dark' ? 'bg-cyan-950/40 text-cyan-400 border-cyan-900/40' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      ROLE COMMISSION DETAILS
                    </span>
                    <p className={`text-[10px] leading-relaxed font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-600'}`}>
                      আপনার প্রোফাইল স্তর <strong className={theme === 'dark' ? 'text-cyan-400' : 'text-indigo-600'}>{user.role}</strong> অনুযায়ী এডমানিতে পাচ্ছেন ২% থেকে ৩.৫% পর্যন্ত ইনস্ট্যান্ট লেভেল কমিশন।
                    </p>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      {[
                        { title: "VIP LEVEL", rate: "3.5%", color: theme === 'dark' ? 'text-cyan-400' : 'text-indigo-600' },
                        { title: "SUB-ADMIN", rate: "2.5%", color: theme === 'dark' ? 'text-cyan-400' : 'text-indigo-600' },
                        { title: "RETAILER", rate: "1.5%", color: theme === 'dark' ? 'text-cyan-400' : 'text-indigo-600' }
                      ].map((lvl, index) => (
                        <div key={index} className={`p-2 rounded-lg border ${
                          theme === 'dark' ? 'bg-slate-950/40 border-slate-800/60' : 'bg-neutral-50 border-neutral-100'
                        }`}>
                          <span className={`text-[8px] font-black block ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>{lvl.title}</span>
                          <span className={`text-xs font-black ${lvl.color}`}>{lvl.rate}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shortcuts inside wallet tab */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        setActivePanel('mfs');
                        playAudio('click');
                      }}
                      className={`p-4 border rounded-xl flex flex-col justify-between h-20 transition-all cursor-pointer text-left active:scale-95 ${
                        theme === 'dark'
                          ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                          : 'bg-white border-neutral-100 hover:border-neutral-200'
                      }`}
                    >
                      <Plus className={`w-5 h-5 p-1 rounded-md ${theme === 'dark' ? 'text-cyan-400 bg-cyan-950/60' : 'text-indigo-600 bg-indigo-50'}`} />
                      <span className={`text-xs font-black mt-1 ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>অ্যাড মানি গেটওয়ে</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsSendMoneyOpen(true);
                        playAudio('click');
                      }}
                      className={`p-4 border rounded-xl flex flex-col justify-between h-20 transition-all cursor-pointer text-left active:scale-95 ${
                        theme === 'dark'
                          ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
                          : 'bg-white border-neutral-100 hover:border-neutral-200'
                      }`}
                    >
                      <Send className={`w-5 h-5 p-1 rounded-md ${theme === 'dark' ? 'text-purple-400 bg-purple-950/60' : 'text-purple-600 bg-purple-50'}`} />
                      <span className={`text-xs font-black mt-1 ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>ব্যালেন্স পাঠান</span>
                    </button>
                  </div>
                </div>
              )}

              {/* === HISTORY TAB VIEW === */}
              {activePanel === 'dashboard' && currentTab === 'history' && (
                <div className="space-y-4 text-left">
                  <div className={`border-b pb-2 flex items-center justify-between gap-2 ${theme === 'dark' ? 'border-slate-800/80' : 'border-neutral-100'}`}>
                    <div>
                      <h2 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>লেনদেন ও অর্ডারের খতিয়ান</h2>
                      <p className={`text-[9px] ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>আপনার করা মোবাইল রিচার্জ, অফার পারচেজ এবং ব্যাংক পেমেন্ট হিস্ট্রি</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsStatementModalOpen(true);
                        playAudio('click');
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>স্টেটমেন্ট রিপোর্ট</span>
                    </button>
                  </div>

                  {/* Search and Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="অর্ডার আইডি, ফোন বা TrxID খুঁজুন..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className={`w-full pl-9 pr-4 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-cyan-500 font-bold ${
                          theme === 'dark'
                            ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600'
                            : 'bg-white border-neutral-200 text-neutral-800'
                        }`}
                      />
                    </div>

                    {/* Filter badges */}
                    <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-none">
                      {[
                        { key: 'all', label: 'সব লেনদেন' },
                        { key: 'Add Money', label: 'ডিপোজিট' },
                        { key: 'Recharge', label: 'রিচার্জ' },
                        { key: 'Drive Pack', label: 'ড্রাইভ প্যাক' },
                        { key: 'Send Money', label: 'সেন্ড মানি' },
                        { key: 'Utility Bill', label: 'ইউটিলিটি বিল' }
                      ].map((badge) => (
                        <button
                          key={badge.key}
                          onClick={() => {
                            setHistoryFilter(badge.key as any);
                            playAudio('click');
                          }}
                          className={`px-2.5 py-1 text-[9px] font-black rounded-lg border whitespace-nowrap transition-all cursor-pointer ${
                            historyFilter === badge.key 
                              ? theme === 'dark'
                                ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-md shadow-cyan-950/20'
                                : 'bg-neutral-950 text-white border-neutral-950 shadow-3xs' 
                              : theme === 'dark'
                                ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                                : 'bg-white text-neutral-500 border-neutral-200 hover:border-neutral-350'
                          }`}
                        >
                          {badge.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of Orders */}
                  <div className="space-y-2.5 max-h-[480px] overflow-y-auto scrollbar-none pr-1">
                    {filteredOrders.length === 0 ? (
                      <div className={`text-center py-12 rounded-2xl border space-y-2 ${
                        theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-neutral-100'
                      }`}>
                        <FileText className="w-8 h-8 text-neutral-300 mx-auto" />
                        <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>কোন অর্ডার বা লেনদেন খুঁজে পাওয়া যায়নি।</p>
                      </div>
                    ) : (
                      filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          onClick={() => {
                            setSelectedInvoice(order);
                            playAudio('click');
                          }}
                          className={`p-3 rounded-2xl border cursor-pointer shadow-4xs flex items-center justify-between space-x-3 transition-all hover:translate-x-0.5 active:scale-98 ${
                            theme === 'dark'
                              ? 'bg-slate-900/60 border-slate-800/85 hover:border-slate-700/80'
                              : 'bg-white border-neutral-100 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2.5 rounded-xl ${
                              order.status === 'Success' 
                                ? theme === 'dark' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                                : order.status === 'Pending' 
                                  ? theme === 'dark' ? 'bg-amber-950/60 text-amber-400 animate-pulse' : 'bg-amber-50 text-amber-600 animate-pulse' 
                                  : theme === 'dark' ? 'bg-rose-950/60 text-rose-400' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {order.type === 'Add Money' ? <Plus className="w-4 h-4" /> :
                               order.type === 'Send Money' ? <Send className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                            </div>
                            <div className="text-left space-y-0.5">
                              <div className="flex items-center space-x-1.5">
                                <span className={`text-[10px] font-black leading-none ${theme === 'dark' ? 'text-slate-100' : 'text-neutral-900'}`}>{order.type}</span>
                                <span className="text-[8px] font-mono text-neutral-400">#{order.id}</span>
                              </div>
                              <p className={`text-[9.5px] font-extrabold truncate max-w-[150px] ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-500'}`}>{order.serviceName}</p>
                              <span className="text-[8px] font-mono text-neutral-400 block">{new Date(order.date).toLocaleDateString('bn-BD')} {new Date(order.date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          <div className="text-right space-y-1">
                            <span className={`text-xs font-black font-mono block ${theme === 'dark' ? 'text-cyan-400' : 'text-neutral-900'}`}>৳{order.amount}</span>
                            {showForeignCurrency && (
                              <span className="text-[8px] font-bold text-emerald-500 font-mono block -mt-0.5 mb-0.5">
                                {globalCurrencyName} {(order.amount / globalCurrencyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                              order.status === 'Success' 
                                ? theme === 'dark' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : order.status === 'Pending' 
                                  ? theme === 'dark' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' : 'bg-amber-50 text-amber-700 border border-amber-100' 
                                  : theme === 'dark' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40' : 'bg-rose-50 text-rose-700 border border-rose-100'
                            }`}>
                              {order.status === 'Success' ? 'সফল' : order.status === 'Pending' ? 'পেন্ডিং' : 'বাতিল'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* === MFS GATEWAY VIEW === */}
              {activePanel === 'mfs' && (
                <div className="animate-fade-in text-left">
                  <MfsGateway 
                    onBack={() => { setActivePanel('dashboard'); handleTabClick('home'); }} 
                    user={user} 
                    onOrderCreated={loadStateData} 
                    theme={theme}
                    initialProvider={mfsProvider}
                  />
                </div>
              )}

              {/* === MFS TRANSFER GATEWAY VIEW === */}
              {activePanel === 'mfs-transfer' && (
                <div className="animate-fade-in text-left">
                  <MfsTransferGateway 
                    onBack={() => { setActivePanel('dashboard'); handleTabClick('home'); }} 
                    user={user} 
                    onOrderCreated={loadStateData} 
                    theme={theme}
                    initialProvider={transferMfsProvider}
                  />
                </div>
              )}

              {/* === BANKING GATEWAY VIEW === */}
              {activePanel === 'banking' && (
                <div className="animate-fade-in text-left">
                  <BankingGateway 
                    onBack={() => { setActivePanel('dashboard'); handleTabClick('home'); }} 
                    user={user} 
                    onOrderCreated={loadStateData} 
                    theme={theme}
                  />
                </div>
              )}

              {/* === DRIVE OFFERS VIEW === */}
              {activePanel === 'offers' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className={`border-b pb-2 flex justify-between items-center ${theme === 'dark' ? 'border-slate-800/80' : 'border-neutral-100'}`}>
                    <div>
                      <h2 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>টেলিকম ড্রাইভ ও ইন্টারনেট প্যাক</h2>
                      <p className={`text-[9px] ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>GP, Robi, Airtel, Banglalink স্পেশাল অফার</p>
                    </div>
                    <button 
                      onClick={() => { setActivePanel('dashboard'); handleTabClick('home'); }}
                      className={`text-[9px] font-extrabold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'text-slate-300 bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white'
                          : 'text-neutral-500 hover:text-neutral-900 bg-white border-neutral-200 shadow-4xs'
                      }`}
                    >
                      বন্ধ করুন
                    </button>
                  </div>

                  <OfferList 
                    offers={offers} 
                    user={user} 
                    onOrderCreated={loadStateData} 
                    theme={theme}
                    initialMode={offersMode}
                  showForeignCurrency={showForeignCurrency} globalCurrencyName={globalCurrencyName} globalCurrencyRate={globalCurrencyRate} />
                </div>
              )}

              {/* === MOBILE RECHARGE VIEW === */}
              {activePanel === 'recharge' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className={`border-b pb-2 flex justify-between items-center ${theme === 'dark' ? 'border-slate-800/80' : 'border-neutral-100'}`}>
                    <div>
                      <h2 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{language === 'BN' ? "মোবাইল রিচার্জ (MOBILE RECHARGE)" : "Mobile Recharge"}</h2>
                      <p className={`text-[9px] ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>যেকোনো সিমে অটোমেটিক মোবাইল ফ্লেক্সিলোড বা রিচার্জ গেটওয়ে</p>
                    </div>
                    <button 
                      onClick={() => { setActivePanel('dashboard'); handleTabClick('home'); }}
                      className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        theme === 'dark'
                          ? 'text-slate-300 bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white'
                          : 'text-neutral-500 hover:text-neutral-900 bg-white border-neutral-200 shadow-4xs'
                      }`}
                    >
                      বন্ধ করুন
                    </button>
                  </div>

                  <div className={`p-5 rounded-2xl border text-left space-y-4 ${
                    theme === 'dark'
                      ? 'bg-slate-900/60 border-slate-800/80 shadow-md'
                      : 'bg-white border-neutral-150 shadow-xs'
                  }`}>
                    <form onSubmit={handleMobileRecharge} className="space-y-4">
                      {/* Operator Selection */}
                      <div className="space-y-1.5">
                        <label className={`text-[9.5px] font-black uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
                          {language === 'BN' ? "মোবাইল অপারেটর নির্বাচন করুন" : "Select Mobile Operator"}
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            { id: 'Grameenphone', short: 'GP', color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
                            { id: 'Robi', short: 'Robi', color: 'bg-red-500/10 text-red-500 border-red-500/30' },
                            { id: 'Airtel', short: 'Airtel', color: 'bg-pink-500/10 text-pink-500 border-pink-500/30' },
                            { id: 'Banglalink', short: 'BL', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
                            { id: 'Teletalk', short: 'TT', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' }
                          ].map((op) => {
                            const isSelected = rechargeOperator === op.id;
                            return (
                              <button
                                key={op.id}
                                type="button"
                                onClick={() => {
                                  setRechargeOperator(op.id as any);
                                  playAudio('click');
                                }}
                                className={`py-2 px-1 rounded-xl border text-[10px] font-black text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? theme === 'dark'
                                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 scale-102 shadow-md shadow-cyan-500/20'
                                      : 'bg-indigo-600 text-white border-indigo-500 scale-102 shadow-sm'
                                    : `${op.color} hover:bg-opacity-85`
                                }`}
                              >
                                {op.short}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Phone Number and Amount */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-1">
                          <label className={`text-[9.5px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
                            {language === 'BN' ? "মোবাইল নম্বর *" : "Mobile Number *"}
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={11}
                            placeholder="যেমন: 017XXXXXXXX"
                            value={rechargePhone}
                            onChange={(e) => setRechargePhone(e.target.value.replace(/\D/g, ''))}
                            className={`p-2 border rounded-lg text-xs font-black font-mono focus:outline-none focus:border-cyan-500 ${
                              theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-700'
                                : 'bg-white border-neutral-200 text-neutral-800'
                            }`}
                          />
                        </div>

                        <div className="flex flex-col space-y-1">
                          <label className={`text-[9.5px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
                            {language === 'BN' ? "পরিমাণ (৳) *" : "Amount (৳) *"}
                          </label>
                          <input
                            type="number"
                            required
                            placeholder="৳ ১০ - ৳ ১০০০"
                            value={rechargeAmount}
                            onChange={(e) => setRechargeAmount(e.target.value)}
                            className={`p-2 border rounded-lg text-xs font-black font-mono focus:outline-none focus:border-cyan-500 ${
                              theme === 'dark'
                                ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-700'
                                : 'bg-white border-neutral-200 text-neutral-800'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Quick Amount Presets */}
                      <div className="space-y-1">
                        <span className={`text-[8.5px] font-black uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>
                          {language === 'BN' ? "জনপ্রিয় রিচার্জ অফারসমূহ" : "Popular Recharge Amounts"}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[20, 29, 50, 99, 149, 299].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setRechargeAmount(preset.toString());
                                playAudio('click');
                              }}
                              className={`px-3 py-1 text-[9.5px] font-black rounded-lg border transition-all cursor-pointer active:scale-95 ${
                                rechargeAmount === preset.toString()
                                  ? theme === 'dark'
                                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                                    : 'bg-indigo-600 text-white border-indigo-500 shadow-3xs'
                                  : theme === 'dark'
                                    ? 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                              }`}
                            >
                              ৳{preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Security PIN */}
                      <div className="flex flex-col space-y-1">
                        <label className={`text-[9.5px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
                          {language === 'BN' ? "ওয়ালেট পিন নম্বর *" : "Security PIN *"}
                        </label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          placeholder="••••"
                          value={rechargePin}
                          onChange={(e) => setRechargePin(e.target.value.replace(/\D/g, ''))}
                          className={`p-2 border rounded-lg text-xs text-center tracking-widest font-black focus:outline-none focus:border-cyan-500 ${
                            theme === 'dark'
                              ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-700'
                              : 'bg-white border-neutral-200 text-neutral-800'
                          }`}
                        />
                      </div>

                      {/* Error & Success Messages */}
                      {rechargeError && (
                        <p className={`text-[10px] font-bold p-2.5 rounded-lg border ${
                          theme === 'dark' ? 'bg-rose-950/40 text-rose-400 border-rose-900/40' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>{rechargeError}</p>
                      )}

                      {rechargeSuccess && (
                        <p className={`text-[10px] font-bold p-2.5 rounded-lg border flex items-center space-x-1.5 ${
                          theme === 'dark' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40' : 'bg-emerald-50 text-emerald-650 border-emerald-150'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>আপনার মোবাইল রিচার্জ আবেদন জমা হয়েছে! অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন।</span>
                        </p>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={rechargeLoading}
                        className={`w-full py-2.5 font-black text-xs rounded-xl transition-all cursor-pointer shadow-md active:scale-95 ${
                          rechargeLoading
                            ? theme === 'dark' ? 'bg-slate-850 text-slate-500' : 'bg-neutral-100 text-neutral-400'
                            : theme === 'dark'
                              ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {rechargeLoading ? 'প্রসেসিং...' : language === 'BN' ? 'রিচার্জ সম্পন্ন করুন' : 'Confirm Recharge'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* === CALLING CARD BRAND VIEW === */}
              {activePanel === 'calling-card' && (
                <div className="animate-fade-in text-left">
                  <CallingCardView 
                    user={user}
                    onBack={() => { setActivePanel('dashboard'); handleTabClick('home'); }}
                    onOrderCreated={loadStateData}
                    theme={theme}
                    orders={orders}
                    onViewActiveCard={setViewingCallingCardDetails} showForeignCurrency={showForeignCurrency} globalCurrencyName={globalCurrencyName} globalCurrencyRate={globalCurrencyRate}

                  />
                </div>
              )}

              {/* === SUPPORT CHAT & LIVE CHAT VIEW === */}
              {activePanel === 'support' && (
                <div className="animate-fade-in text-left">
                  <HelpSupport 
                    onTicketCreated={loadStateData} 
                    user={user}
                    orders={orders}
                    theme={theme}
                  />
                </div>
              )}

              {/* === PROFILE & HISTORY VIEW === */}
              {activePanel === 'profile' && (
                <div className="animate-fade-in text-left">
                  <ProfileSettings 
                    user={user} 
                    orders={orders} 
                    tickets={tickets} 
                    onRefresh={loadStateData} 
                    theme={theme}
                    onToggleAdminMode={() => {
                      setIsAdminMode(true);
                      setActivePanel('admin');
                      playAudio('click');
                    }}
                  />
                </div>
              )}

            </div>
          )}

        </div>

        {/* FLOATING SUPPORT BUTTON */}
        {!isAdminMode && activePanel !== 'support' && (
          <button
            onClick={() => { playAudio('click'); handleTabClick('support'); }}
            className={`absolute bottom-20 right-4 z-40 p-1 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${
              theme === 'dark' ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-cyan-500/40' : 'bg-gradient-to-r from-cyan-600 to-emerald-500 shadow-cyan-500/40'
            }`}
          >
            <div className={`rounded-full p-1.5 ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
              <img 
                src="https://img.icons8.com/color/96/customer-support.png" 
                alt="Customer Care" 
                className="w-9 h-9 object-contain animate-pulse drop-shadow-lg"
              />
            </div>
          </button>
        )}

        {/* BOTTOM NAVIGATION BAR */}
        {!isAdminMode && (
          <div className={`absolute bottom-0 left-0 right-0 z-30 h-16 flex items-center justify-around rounded-b-[40px] sm:rounded-b-[40px] transition-all duration-300 ${
            theme === 'dark' 
              ? 'bg-[#0B0F19]/95 border-t border-slate-800/80 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]' 
              : 'bg-white/95 border-t border-neutral-100/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
          }`}>
            {[
              { id: 'home', label: 'Home', icon: Home, action: () => handleTabClick('home') },
              { id: 'history', label: 'History', icon: History, action: () => handleTabClick('history') },
              { id: 'scan', label: 'Scan & Pay', icon: QrCode, action: () => { playAudio('click'); alert(language === 'BN' ? 'কিউআর কোড স্ক্যানার সক্রিয় করা হচ্ছে...' : 'Initializing Secure QR Code Reader...'); } },
              { id: 'offers', label: 'Offers', icon: Sparkles, action: () => { playAudio('click'); setOffersMode('internet'); setActivePanel('offers'); } },
              { id: 'profile', label: 'Profile', icon: UserIcon, action: () => handleTabClick('profile') }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSel = currentTab === tab.id && !isAdminMode && activePanel === 'dashboard';

              if (tab.id === 'scan') {
                return (
                  <button
                    key={tab.id}
                    onClick={tab.action}
                    className="relative flex flex-col items-center justify-center cursor-pointer group px-2 -mt-6"
                  >
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/40 border-4 border-[#0B0F19] text-white active:scale-95 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className={`text-[9px] font-black mt-1.5 tracking-tight ${
                      theme === 'dark' ? 'text-slate-300' : 'text-neutral-500'
                    }`}>{tab.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={tab.action}
                  className="flex flex-col items-center justify-center h-full px-4 cursor-pointer group active:scale-95 transition-transform"
                >
                  <div className={`p-1.5 rounded-xl transition-all ${
                    isSel 
                      ? theme === 'dark'
                        ? 'text-indigo-400'
                        : 'text-indigo-600' 
                      : theme === 'dark'
                        ? 'text-slate-500 group-hover:text-slate-300'
                        : 'text-neutral-400 group-hover:text-neutral-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[9px] font-black mt-0.5 tracking-tight transition-all ${
                    isSel 
                      ? theme === 'dark'
                        ? 'text-indigo-400 font-extrabold'
                        : 'text-indigo-600 font-extrabold'
                      : theme === 'dark'
                        ? 'text-slate-500'
                        : 'text-neutral-400'
                  }`}>{tab.label}</span>
                  {isSel && (
                    <div className={`w-1 h-1 rounded-full mt-0.5 ${theme === 'dark' ? 'bg-indigo-400' : 'bg-indigo-600'}`}></div>
                  )}
                </button>
              );
            })}
          </div>
        )}

{/* =======================================
            SLIDE-UP OVERLAYS & MODAL DIALOGS 
           ======================================= */}

        {/* VIEW ACTIVE CALLING CARD DETAILS MODAL */}
        {viewingCallingCardDetails && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
            <div className={`w-full max-w-[390px] rounded-[24px] p-6 space-y-5 animate-scale-up shadow-2xl border ${
              theme === 'dark' 
                ? 'bg-neutral-900 text-white border-neutral-800' 
                : 'bg-white text-neutral-900 border-neutral-100'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${
                theme === 'dark' ? 'border-neutral-800' : 'border-neutral-100'
              }`}>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span className={`text-xs font-black uppercase tracking-tight ${
                    theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'
                  }`}>
                    সক্রিয় কলিং কার্ড ডিটেইলস
                  </span>
                </div>
                <button 
                  onClick={() => { playAudio('click'); setViewingCallingCardDetails(null); }} 
                  className={`p-1.5 rounded-full transition-colors ${
                    theme === 'dark' ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Card visualizer / Voucher image if provided by admin */}
              {viewingCallingCardDetails.cardImageUrl ? (
                <div className="relative overflow-hidden rounded-xl border border-neutral-200 shadow-inner bg-neutral-950 aspect-[16/10] flex items-center justify-center">
                  <img 
                    src={viewingCallingCardDetails.cardImageUrl} 
                    alt="Calling Card Voucher" 
                    referrerPolicy="no-referrer"
                    className="object-contain w-full h-full"
                  />
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl aspect-[16/10] bg-black shadow-[0_0_25px_rgba(0,255,255,0.2)] border border-[#00f7ff]/30 p-4 flex gap-4 select-none group">
                  {/* Neon Glow Background Effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#000d1a] to-[#0a1a0a] z-0"></div>
                  <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#00f7ff]/20 rounded-full blur-[40px] z-0 group-hover:bg-[#00f7ff]/30 transition-all duration-700"></div>
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#00ff22]/20 rounded-full blur-[40px] z-0 group-hover:bg-[#00ff22]/30 transition-all duration-700"></div>
                  
                  {/* Left Column - Logo & Brand */}
                  <div className="relative z-10 w-[45%] flex flex-col items-center justify-center space-y-2 border-r border-[#00f7ff]/20 pr-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-[3px] border-[#00f7ff] flex items-center justify-center shadow-[0_0_15px_rgba(0,247,255,0.5)] bg-[#001a2a]">
                        <Smartphone className="w-8 h-8 text-[#00f7ff]" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#00ff22] rounded-full border-2 border-black flex items-center justify-center shadow-[0_0_10px_rgba(0,255,34,0.5)]">
                        <Phone className="w-4 h-4 text-black" />
                      </div>
                    </div>
                    <div className="text-center mt-3">
                      <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-[#00f7ff] uppercase tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-tight">
                        A TO Z
                      </h3>
                      <p className="text-xs font-bold text-[#00f7ff] tracking-widest uppercase">
                        ONLINE
                      </p>
                      <div className="mt-1 px-2 py-0.5 bg-gradient-to-r from-[#00f7ff]/0 via-[#00f7ff]/30 to-[#00f7ff]/0 border-y border-[#00f7ff]/40">
                        <span className="text-[8px] font-black tracking-widest text-[#00f7ff] uppercase">
                          {viewingCallingCardDetails.serviceName || 'A TO Z SERVICE'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Credentials */}
                  <div className="relative z-10 flex-1 flex flex-col justify-center space-y-3 pl-2">
                    
                    {/* Username Block */}
                    <div className="relative bg-black/40 border border-[#00f7ff]/30 p-2 rounded-xl flex items-center gap-3 backdrop-blur-sm shadow-[0_0_10px_rgba(0,247,255,0.1)] group/item overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00f7ff] to-transparent"></div>
                      <div className="w-8 h-8 rounded-full bg-[#001a2a] border border-[#00f7ff] flex items-center justify-center shadow-[0_0_8px_rgba(0,247,255,0.4)] shrink-0 group-hover/item:shadow-[0_0_12px_rgba(0,247,255,0.8)] transition-all">
                        <UserIcon className="w-4 h-4 text-[#00f7ff]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-extrabold text-[#00f7ff] uppercase tracking-widest leading-none mb-0.5">Username</p>
                        <p className="text-sm font-black text-white truncate drop-shadow-md select-all">
                          {viewingCallingCardDetails.cardPin || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Password Block */}
                    {viewingCallingCardDetails.cardPassword && (
                      <div className="relative bg-black/40 border border-[#00f7ff]/30 p-2 rounded-xl flex items-center gap-3 backdrop-blur-sm shadow-[0_0_10px_rgba(0,247,255,0.1)] group/item overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00f7ff] to-transparent"></div>
                        <div className="w-8 h-8 rounded-full bg-[#001a2a] border border-[#00f7ff] flex items-center justify-center shadow-[0_0_8px_rgba(0,247,255,0.4)] shrink-0 group-hover/item:shadow-[0_0_12px_rgba(0,247,255,0.8)] transition-all">
                          <Lock className="w-4 h-4 text-[#00f7ff]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-extrabold text-[#00f7ff] uppercase tracking-widest leading-none mb-0.5">Pass</p>
                          <p className="text-sm font-black text-white truncate drop-shadow-md select-all">
                            {viewingCallingCardDetails.cardPassword}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Opcode Block (Mapped to Expiry or a specific field) */}
                    {(viewingCallingCardDetails.cardExpiry || viewingCallingCardDetails.cardOpcode) && (
                      <div className="relative bg-black/40 border border-[#00ff22]/30 p-2 rounded-xl flex items-center gap-3 backdrop-blur-sm shadow-[0_0_10px_rgba(0,255,34,0.1)] group/item overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00ff22] to-transparent"></div>
                        <div className="w-8 h-8 rounded-full bg-[#0a1a0a] border border-[#00ff22] flex items-center justify-center shadow-[0_0_8px_rgba(0,255,34,0.4)] shrink-0 group-hover/item:shadow-[0_0_12px_rgba(0,255,34,0.8)] transition-all">
                          <ShieldCheck className="w-4 h-4 text-[#00ff22]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-extrabold text-[#00ff22] uppercase tracking-widest leading-none mb-0.5">Opcode</p>
                          <p className="text-sm font-black text-white truncate drop-shadow-md select-all">
                            {viewingCallingCardDetails.cardExpiry || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                  </div>
                </div>
              )}

              {/* Detailed specs */}
              <div className="space-y-3 text-xs">
                <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                  theme === 'dark' ? 'bg-neutral-850 border-neutral-800' : 'bg-neutral-50 border-neutral-150'
                }`}>
                  <div className="flex justify-between items-center text-[11px] font-semibold">
                    <span className="text-neutral-400">কার্ড অপারেটর:</span>
                    <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                      {viewingCallingCardDetails.serviceName}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px] font-semibold border-t pt-2 border-neutral-200/50">
                    <span className="text-neutral-400">PIN / Username:</span>
                    <span className="font-mono font-black text-yellow-500 bg-neutral-950/5 px-2 py-0.5 rounded select-all">
                      {viewingCallingCardDetails.cardPin || 'N/A'}
                    </span>
                  </div>

                  {viewingCallingCardDetails.cardPassword && (
                    <div className="flex justify-between items-center text-[11px] font-semibold border-t pt-2 border-neutral-200/50">
                      <span className="text-neutral-400">Password:</span>
                      <span className="font-mono font-black text-indigo-500 bg-neutral-950/5 px-2 py-0.5 rounded select-all">
                        {viewingCallingCardDetails.cardPassword}
                      </span>
                    </div>
                  )}

                  {viewingCallingCardDetails.cardExpiry && (
                    <div className="flex justify-between items-center text-[11px] font-semibold border-t pt-2 border-neutral-200/50">
                      <span className="text-neutral-400">মেয়াদ / Expiry:</span>
                      <span className={`font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                        {viewingCallingCardDetails.cardExpiry}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[11px] font-semibold border-t pt-2 border-neutral-200/50">
                    <span className="text-neutral-400">অর্ডার আইডি:</span>
                    <span className="font-mono font-bold text-neutral-400">
                      {viewingCallingCardDetails.id}
                    </span>
                  </div>
                </div>

                <p className="text-[9.5px] text-center text-neutral-400 font-bold">
                  *পিন অথবা পাসওয়ার্ড এর ওপর ক্লিক করে কপি করুন।
                </p>
              </div>

              <button
                type="button"
                onClick={() => { playAudio('click'); setViewingCallingCardDetails(null); }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer animate-pulse"
              >
                বন্ধ করুন (Close Card)
              </button>
            </div>
          </div>
        )}

        {/* 1. SEND MONEY DRAWER SHEET */}
        {isSendMoneyOpen && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex items-end justify-center z-50 animate-fade-in">
            <div className={`w-full max-w-[430px] rounded-t-[28px] p-6 space-y-5 animate-slide-up shadow-2xl text-left border-t ${
              theme === 'dark' 
                ? 'bg-neutral-900 text-white border-neutral-850' 
                : 'bg-white text-neutral-900 border-neutral-100'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 ${
                theme === 'dark' ? 'border-neutral-800' : 'border-neutral-100'
              }`}>
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 text-purple-600" />
                  <span className={`text-xs font-black uppercase tracking-tight ${
                    theme === 'dark' ? 'text-white' : 'text-neutral-900'
                  }`}>
                    ওয়ালেট ট্রান্সফার (Send Money)
                  </span>
                </div>
                <button 
                  onClick={() => { setIsSendMoneyOpen(false); setSendError(''); setSendSuccess(false); }} 
                  className={`p-1.5 rounded-full transition-colors ${
                    theme === 'dark' ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-50 text-neutral-500'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* SENDER USER PROFILE & BALANCE CARD */}
              <div className={`p-4 rounded-2xl border ${
                theme === 'dark' 
                  ? 'bg-neutral-950/50 border-neutral-850' 
                  : 'bg-neutral-50 border-neutral-200'
              } space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${
                    theme === 'dark' 
                      ? 'bg-purple-950/50 text-purple-400 border border-purple-900/40' 
                      : 'bg-purple-50 text-purple-700 border border-purple-100'
                  }`}>
                    👤 Username: @{user?.email?.split('@')[0] || user?.name?.toLowerCase().replace(/\s+/g, '') || 'shakibuser'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className={`text-sm font-black tracking-tight ${
                    theme === 'dark' ? 'text-slate-100' : 'text-neutral-900'
                  }`}>
                    💳 Wallet Balance: ৳{user?.walletBalance ?? 0}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSendMoneySubmit} className="space-y-4">
                {/* Recipient Phone Number */}
                <div className="flex flex-col space-y-1.5">
                  <label className={`text-[10.5px] font-black uppercase tracking-wider ${
                    theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    প্রাপকের শাকিবপে নম্বর / User Number *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="01XXXXXXXXX (প্রাপকের শাকিবপে নম্বর)"
                    value={sendPhone}
                    onChange={(e) => setSendPhone(e.target.value)}
                    className={`p-3 rounded-xl text-xs font-bold focus:outline-none focus:ring-1.5 focus:ring-purple-500/50 border ${
                      theme === 'dark'
                        ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600'
                        : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400'
                    }`}
                  />
                </div>

                {/* Transfer Amount */}
                <div className="flex flex-col space-y-1.5">
                  <label className={`text-[10.5px] font-black uppercase tracking-wider ${
                    theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    টাকার পরিমাণ (Amount BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="৳ টাকার পরিমাণ BDT"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className={`p-3 rounded-xl text-xs font-bold focus:outline-none focus:ring-1.5 focus:ring-purple-500/50 border ${
                      theme === 'dark'
                        ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600'
                        : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400'
                    }`}
                  />
                  {/* Quick selection chips */}
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {[100, 500, 1000, 2000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSendAmount(amt.toString());
                          playAudio('click');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          sendAmount === amt.toString()
                            ? 'bg-purple-600 text-white shadow-xs'
                            : theme === 'dark'
                            ? 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-100'
                        }`}
                      >
                        ৳{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PIN Field */}
                <div className="flex flex-col space-y-1.5">
                  <label className={`text-[10.5px] font-black uppercase tracking-wider ${
                    theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    পিন নম্বর (4-Digit PIN) *
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={sendPin}
                    onChange={(e) => setSendPin(e.target.value)}
                    className={`p-3 rounded-xl text-xs font-black text-center tracking-widest focus:outline-none focus:ring-1.5 focus:ring-purple-500/50 border ${
                      theme === 'dark'
                        ? 'bg-neutral-950 border-neutral-800 text-white placeholder-neutral-600'
                        : 'bg-white border-neutral-200 text-neutral-900 placeholder-neutral-400'
                    }`}
                  />
                </div>

                {sendError && (
                  <p className="text-[10.5px] text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30">
                    {sendError}
                  </p>
                )}

                {sendSuccess && (
                  <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                    <span>ব্যালেন্স স্থানান্তর সফল হয়েছে!</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sendLoading}
                  className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer active:scale-98 flex items-center justify-center space-x-1"
                >
                  <span>{sendLoading ? 'স্থানান্তর হচ্ছে...' : 'Send Money Now (টাকা পাঠান) ➔'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* SUCCESSFUL TRANSACTION INVOICE POPUP */}
        {lastTxnDetails && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="w-full max-w-[380px] flex flex-col space-y-4 animate-scale-up">
              
              {/* Receipt slip container (Captured by html2canvas) */}
              <div 
                ref={invoiceRef}
                className={`p-6 rounded-2xl shadow-2xl relative overflow-hidden border ${
                  theme === 'dark' 
                    ? 'bg-slate-900 text-slate-100 border-slate-800' 
                    : 'bg-white text-slate-800 border-slate-100'
                }`}
              >
                {/* Decorative backgrounds */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>

                {/* Header */}
                <div className="text-center space-y-2 pb-4 border-b border-dashed border-neutral-200 dark:border-neutral-800">
                  <div className="flex justify-center mb-1">
                    <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
                      <span>✦</span> <span>Money Sent</span>
                    </span>
                  </div>
                  <h3 className="text-sm font-black tracking-tight text-neutral-900 dark:text-white uppercase">
                    Shakib Pay
                  </h3>
                  <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400">
                    Send Money Receipt
                  </p>
                </div>

                {/* Transaction Amount */}
                <div className="py-5 text-center space-y-1">
                  <span className="text-[10px] font-black tracking-widest text-neutral-400 uppercase">Amount Sent</span>
                  <div className="text-3xl font-black text-emerald-500 dark:text-emerald-400 tracking-tight">
                    +৳{lastTxnDetails.amount}
                  </div>
                  <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                    BDT (Bangladeshi Taka)
                  </div>
                </div>

                {/* Details List */}
                <div className="space-y-3.5 py-4 border-t border-b border-dashed border-neutral-200 dark:border-neutral-800 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 dark:text-neutral-500 font-bold">Invoice No:</span>
                    <span className="font-mono font-black text-neutral-950 dark:text-white bg-neutral-100 dark:bg-neutral-950 px-2 py-0.5 rounded text-[11px]">
                      {lastTxnDetails.invoiceNo}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 dark:text-neutral-500 font-bold">Sender Username:</span>
                    <span className="font-black text-neutral-900 dark:text-neutral-200">
                      @{lastTxnDetails.senderUsername}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 dark:text-neutral-500 font-bold">Recipient:</span>
                    <span className="font-black text-neutral-900 dark:text-neutral-200">
                      {lastTxnDetails.recipientPhone}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 dark:text-neutral-500 font-bold">Method:</span>
                    <span className="font-black text-neutral-950 dark:text-white bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 rounded text-[11px] uppercase">
                      {lastTxnDetails.method}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 dark:text-neutral-500 font-bold">Remaining Balance:</span>
                    <span className="font-black text-neutral-900 dark:text-neutral-200">
                      ৳{lastTxnDetails.senderNewBalance}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 dark:text-neutral-500 font-bold">Timestamp:</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-200 text-right">
                      {lastTxnDetails.currentDateTime}
                    </span>
                  </div>
                </div>

                {/* Footer Brand */}
                <div className="pt-3 text-center">
                  <p className="text-[9px] font-black tracking-widest text-neutral-400 dark:text-neutral-500 uppercase">
                    Thank you for using Shakib Pay
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const text = `--------------------------------------------------\n` +
                                 `Shakib Pay - Send Money Receipt\n` +
                                 `Sender: @${lastTxnDetails.senderUsername}\n` +
                                 `Recipient: ${lastTxnDetails.recipientPhone}\n` +
                                 `Amount: ৳${lastTxnDetails.amount} BDT\n` +
                                 `Invoice: ${lastTxnDetails.invoiceNo}\n` +
                                 `Date: ${lastTxnDetails.currentDateTime}\n` +
                                 `--------------------------------------------------`;
                    navigator.clipboard.writeText(text);
                    const btn = document.getElementById('btn-copy-summary');
                    if (btn) {
                      const oldTxt = btn.innerText;
                      btn.innerText = '✓ Copied!';
                      setTimeout(() => { btn.innerText = oldTxt; }, 2000);
                    }
                  }}
                  id="btn-copy-summary"
                  className="flex items-center justify-center space-x-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  <span>📋 Copy Text Summary</span>
                </button>
                <button
                  onClick={async () => {
                    if (!invoiceRef.current) return;
                    const saveBtn = document.getElementById('btn-save-photo');
                    if (saveBtn) saveBtn.innerText = 'Saving...';

                    try {
                      await new Promise((resolve) => setTimeout(resolve, 300));
                      const canvas = await captureCanvasSafely(invoiceRef.current, {
                        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff'
                      });
                      const dataUrl = canvas.toDataURL('image/png');
                      const link = document.createElement('a');
                      link.download = `shakibpay_receipt_${lastTxnDetails.invoiceNo}.png`;
                      link.href = dataUrl;
                      link.click();
                    } catch (err) {
                      console.error('Failed to save receipt image:', err);
                    } finally {
                      if (saveBtn) saveBtn.innerText = '🖼️ Save Invoice Photo';
                    }
                  }}
                  id="btn-save-photo"
                  className="flex items-center justify-center space-x-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  <span>🖼️ Save Invoice Photo</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setLastTxnDetails(null)}
                className="w-full py-3 bg-neutral-200 hover:bg-neutral-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-neutral-800 dark:text-white text-xs font-black rounded-xl transition-all active:scale-95 cursor-pointer text-center"
              >
                Close Receipt
              </button>

            </div>
          </div>
        )}

        {/* 2. ADD USER DRAWER SHEET */}
        {isAddUserOpen && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in">
            <div 
              className="w-full max-w-[430px] rounded-[20px] p-6 space-y-5 animate-slide-up max-h-[90%] overflow-y-auto scrollbar-none text-left"
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '20px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-[#10b981]" />
                  <span className="text-xs font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">নতুন রিসেলার ইউজার যোগ করুন</span>
                </div>
                <button 
                  onClick={() => { setIsAddUserOpen(false); setAddErrorMsg(''); setAddSuccessMsg(''); setIsRoleDropdownOpen(false); }} 
                  className="p-1 hover:bg-slate-800/60 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-3.5">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-white uppercase tracking-wider">ইউজারের নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: আবির হাসান"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="p-2 border rounded-xl text-xs font-bold focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] transition-all text-white placeholder-slate-400"
                    style={{ background: 'rgba(255, 255, 255, 0.07)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-white uppercase tracking-wider">রিসেলার ফোন নম্বর *</label>
                  <input
                    type="tel"
                    required
                    placeholder="১১ ডিজিটের মোবাইল নম্বর"
                    maxLength={11}
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="p-2 border rounded-xl text-xs font-bold focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] transition-all text-white placeholder-slate-400"
                    style={{ background: 'rgba(255, 255, 255, 0.07)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider">রিসেলার লেভেল</label>
                    <div className="relative">
                      <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value)}
                        className="w-full p-2.5 pr-8 border rounded-xl text-xs font-bold transition-all text-white bg-slate-900/90 focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] cursor-pointer appearance-none"
                        style={{ background: 'rgba(255, 255, 255, 0.07)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                      >
                        {(() => {
                          const ROLE_HIERARCHY: Record<string, number> = {
                            'Admin': 6,
                            'Sub-Admin': 5,
                            'Reseller': 4,
                            'Dealer': 4,
                            'Retailer': 3,
                            'VIP': 2,
                            'Normal User': 1,
                            'User': 1
                          };
                          const userScore = ROLE_HIERARCHY[user?.role || 'Normal User'] || 1;
                          const allowed = Object.keys(ROLE_HIERARCHY).filter(r => {
                            const score = ROLE_HIERARCHY[r];
                            return score < userScore && r !== 'Dealer';
                          });
                          return allowed.map((roleKey) => (
                            <option key={roleKey} value={roleKey} className="bg-slate-950 text-white font-bold">
                              {roleKey === 'VIP' ? 'VIP-Parent' : roleKey}
                            </option>
                          ));
                        })()}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider">প্রাথমিক ফান্ড ট্রান্সফার</label>
                    <input
                      type="number"
                      placeholder="ঐচ্ছিক (যেমন: ৫০০)"
                      value={addBalance}
                      onChange={(e) => setAddBalance(e.target.value)}
                      className="p-2 border rounded-xl text-xs font-bold focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] transition-all text-white placeholder-slate-400"
                      style={{ background: 'rgba(255, 255, 255, 0.07)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider">পাসওয়ার্ড *</label>
                    <input
                      type="password"
                      required
                      placeholder="পাসওয়ার্ড"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      className="p-2 border rounded-xl text-xs font-bold focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] transition-all text-white placeholder-slate-400"
                      style={{ background: 'rgba(255, 255, 255, 0.07)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider">৪ ডিজিটের পিন *</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="••••"
                      value={addPin}
                      onChange={(e) => setAddPin(e.target.value)}
                      className="p-2 border rounded-xl text-xs text-center tracking-widest font-black focus:outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] transition-all text-white placeholder-slate-400"
                      style={{ background: 'rgba(255, 255, 255, 0.07)', borderColor: 'rgba(255, 255, 255, 0.15)' }}
                    />
                  </div>
                </div>

                {addErrorMsg && (
                  <p className="text-[10.5px] font-bold p-2 rounded-lg border bg-rose-950/40 text-rose-300 border-rose-900/40">{addErrorMsg}</p>
                )}

                {addSuccessMsg && (
                  <p className="text-[10.5px] font-bold p-2 rounded-lg border flex items-center space-x-1.5 bg-emerald-950/40 text-emerald-300 border-emerald-900/40">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{addSuccessMsg}</span>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-black text-xs rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-98 mt-1 cursor-pointer"
                >
                  নতুন রিসেলার অ্যাকাউন্ট খুলুন
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 3. MY USERS LIST DRAWER SHEET */}
        {isMyUsersOpen && (() => {
          const mySubUsers = user?.role === 'Admin' 
            ? allUsers 
            : allUsers.filter(su => su.id !== user?.id && ((su.createdBy && su.createdBy === user?.id) || (su.createdByPhone && su.createdByPhone === user?.phone)));

          return (
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-end justify-center z-50 cursor-pointer"
              onClick={() => setIsMyUsersOpen(false)}
            >
              <div 
                className="bg-white w-full max-w-[430px] rounded-t-[28px] p-5 space-y-4 animate-slide-up shadow-2xl max-h-[85%] overflow-y-auto scrollbar-none text-left cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with Back and Close buttons */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <button 
                    onClick={() => setIsMyUsersOpen(false)} 
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>ফিরে যান</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-pink-600" />
                    <span className="text-xs font-black text-neutral-900">আমার ইউজার ({mySubUsers.length})</span>
                  </div>

                  <button 
                    onClick={() => setIsMyUsersOpen(false)} 
                    className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-500 hover:text-neutral-900 transition-all cursor-pointer"
                    title="বন্ধ করুন"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub users scrollable list */}
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto scrollbar-none pr-0.5">
                  {mySubUsers.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-neutral-500">আপনার খোলা কোনো সাব-ইউজার বা রিসেলার অ্যাকাউন্ট নেই</p>
                      <button
                        onClick={() => {
                          setIsMyUsersOpen(false);
                          setIsAddUserOpen(true);
                        }}
                        className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                      >
                        নতুন ইউজার খুলুন
                      </button>
                    </div>
                  ) : (
                    mySubUsers.map((su) => (
                      <div
                        key={su.id || su.phone}
                        className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center justify-between space-x-3"
                      >
                        <div className="text-left space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-black text-neutral-900">{su.name}</span>
                            <span className="bg-indigo-50 text-indigo-700 text-[8px] font-extrabold px-1.5 py-0.2 rounded">
                              {su.role}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono font-bold">{su.phone}</p>
                          <span className="text-[8.5px] text-neutral-400 block font-medium">Status: {su.status || 'Active'}</span>
                        </div>

                        <div className="text-right space-y-1.5">
                          <span className="text-xs font-black text-emerald-600 block font-mono">৳{su.walletBalance} BDT</span>
                          <button
                            onClick={() => {
                              setTransferTargetPhone(su.phone);
                              setTransferTargetName(su.name);
                              setIsTransferOpen(true);
                            }}
                            className="text-[9px] font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded-md shadow-4xs cursor-pointer active:scale-95"
                          >
                            ফান্ড পাঠান
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bottom Close/Back Button */}
                <div className="pt-2 border-t border-neutral-100">
                  <button
                    onClick={() => setIsMyUsersOpen(false)}
                    className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <ChevronLeft className="w-4 h-4 text-neutral-500" />
                    <span>ড্যাশবোর্ডে ফিরে যান (Close)</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 4. ACTIVE FUND TRANSFER MODAL ON SELECTED SUB-USER */}
        {isTransferOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
            <div className="bg-white w-full max-w-[360px] rounded-2xl p-5 space-y-4 animate-scale-up shadow-2xl text-left">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <div className="flex items-center space-x-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-black text-neutral-900">ফান্ড স্থানান্তর ({transferTargetName})</span>
                </div>
                <button onClick={() => { setIsTransferOpen(false); setTransferError(''); }} className="p-1 hover:bg-neutral-50 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFundTransferSubmit} className="space-y-3.5">
                <div className="p-2 bg-indigo-50/50 rounded-xl text-[10px] text-indigo-800 font-semibold border border-indigo-100">
                  গ্রাহক নম্বর: {transferTargetPhone}
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[9.5px] font-bold text-neutral-500 uppercase tracking-wider">টাকার পরিমাণ BDT *</label>
                  <input
                    type="number"
                    required
                    placeholder="৳ যেমন: ১০০০"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="p-2 border border-neutral-200 bg-white rounded-lg text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[9.5px] font-bold text-neutral-500 uppercase tracking-wider">আপনার ওয়ালেট পিন *</label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="••••"
                    value={transferPin}
                    onChange={(e) => setTransferPin(e.target.value)}
                    className="p-2 border border-neutral-200 bg-white rounded-lg text-xs text-center tracking-widest font-black focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {transferError && (
                  <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded border border-rose-100">{transferError}</p>
                )}

                {transferSuccess && (
                  <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 p-2 rounded border border-emerald-100 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>ফান্ড স্থানান্তর সফল হয়েছে!</span>
                  </p>
                )}

                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setIsTransferOpen(false); setTransferError(''); }}
                    className="px-3 py-1.5 border border-neutral-200 text-neutral-500 font-bold rounded-lg text-xs hover:bg-neutral-50 cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg text-xs shadow-4xs cursor-pointer active:scale-95"
                  >
                    স্থানান্তর করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 5. DIGITAL RECEIPT INVOICE DIALOG MODAL */}
        {selectedInvoice && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
            <div className="bg-white w-full max-w-[370px] rounded-2xl p-5 space-y-4 animate-scale-up shadow-2xl relative text-left">
              
              {/* Receipt pattern outline */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-t-2xl"></div>

              <div className="text-center pt-2 space-y-1">
                <span className="text-[10px] text-indigo-600 font-black tracking-widest uppercase">SHAKIB PAY E-INVOICE</span>
                <h3 className="text-xs font-black text-neutral-900">ডিজিটাল ট্রানজেকশন রশিদ</h3>
                <span className="inline-block text-[8px] font-mono text-neutral-400">Order ID: {selectedInvoice.id}</span>
              </div>

              {/* Status stamp */}
              <div className="flex justify-center my-1.5">
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full border-2 ${
                  selectedInvoice.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                  selectedInvoice.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-rose-50 text-rose-700 border-rose-300'
                }`}>
                  {selectedInvoice.status === 'Success' ? '✓ APPROVED' : selectedInvoice.status === 'Pending' ? '⌚ PENDING' : '✗ REJECTED'}
                </span>
              </div>

              {/* Invoice Rows */}
              <div className="space-y-2 text-xs border-y border-dashed border-neutral-200 py-3 font-medium text-neutral-700">
                <div className="flex justify-between">
                  <span className="text-neutral-400">লেনদেন টাইপ:</span>
                  <span className="font-bold text-neutral-900">{selectedInvoice.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">সার্ভিস চ্যানেল:</span>
                  <span className="font-bold text-neutral-900">{selectedInvoice.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">গ্রাহক নম্বর:</span>
                  <span className="font-bold text-neutral-900 font-mono">{selectedInvoice.userPhone}</span>
                </div>
                {selectedInvoice.trxId && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">TrxID ট্রানজেকশন ID:</span>
                    <span className="font-bold text-indigo-600 font-mono">{selectedInvoice.trxId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-neutral-400">তারিখ ও সময়:</span>
                  <span className="font-bold text-neutral-900">{new Date(selectedInvoice.date).toLocaleDateString('bn-BD')} {new Date(selectedInvoice.date).toLocaleTimeString('bn-BD')}</span>
                </div>
                {selectedInvoice.commissionDeducted !== undefined && selectedInvoice.commissionDeducted > 0 && (
                  <div className="flex justify-between text-indigo-600">
                    <span>রোল কমিশন বোনাস (+):</span>
                    <span className="font-black font-mono">৳{selectedInvoice.commissionDeducted} BDT</span>
                  </div>
                )}
                {selectedInvoice.cancellationReason && (
                  <div className="p-2 bg-rose-50 rounded text-[10px] text-rose-700 border border-rose-100 font-semibold leading-relaxed mt-1">
                    বাতিলের কারণ: {selectedInvoice.cancellationReason}
                  </div>
                )}
              </div>

              {/* Total amount block */}
              <div className="bg-neutral-50 p-3 rounded-xl flex justify-between items-center">
                <span className="text-xs font-black text-neutral-900 uppercase">মোট পরিশোধ</span>
                <div className="text-right">
                  <span className="text-sm font-black text-indigo-600 font-mono block">৳{selectedInvoice.amount.toLocaleString('bn-BD')} BDT</span>
                  {showForeignCurrency && (
                    <span className="text-[10px] font-bold text-emerald-600 font-mono block">
                      {globalCurrencyName} {(selectedInvoice.amount / globalCurrencyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const printWindow = window.open('', 'PRINT', 'height=600,width=400');
                    if (printWindow) {
                      printWindow.document.write(`<html><head><title>Invoice</title><style>body{font-family:sans-serif;padding:30px;color:#333;}h2{text-align:center;margin-bottom:5px;}p{margin:3px 0;font-size:14px;}</style></head><body>`);
                      printWindow.document.write(`<h2>SHAKIB PAY DIGITAL VOUCHER</h2>`);
                      printWindow.document.write(`<p style="text-align:center;color:#666;">ID: ${selectedInvoice.id}</p><hr/>`);
                      printWindow.document.write(`<p><b>Type:</b> ${selectedInvoice.type}</p>`);
                      printWindow.document.write(`<p><b>Service:</b> ${selectedInvoice.serviceName}</p>`);
                      printWindow.document.write(`<p><b>Phone:</b> ${selectedInvoice.userPhone}</p>`);
                      if (selectedInvoice.trxId) printWindow.document.write(`<p><b>TrxID:</b> ${selectedInvoice.trxId}</p>`);
                      printWindow.document.write(`<p><b>Amount:</b> ৳${selectedInvoice.amount} BDT` + (showForeignCurrency ? ` / ${(selectedInvoice.amount / globalCurrencyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${globalCurrencyName}` : '') + `</p>`);
                      printWindow.document.write(`<p><b>Status:</b> ${selectedInvoice.status}</p>`);
                      printWindow.document.write(`<p><b>Date:</b> ${new Date(selectedInvoice.date).toLocaleString()}</p>`);
                      printWindow.document.write(`</body></html>`);
                      printWindow.document.close();
                      printWindow.focus();
                      printWindow.print();
                    }
                  }}
                  className="flex-1 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-4xs cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>রশিদ প্রিন্ট</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="flex-1 py-2 bg-neutral-950 hover:bg-neutral-900 text-white font-black rounded-xl text-xs flex items-center justify-center cursor-pointer active:scale-95"
                >
                  বন্ধ করুন
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 6. DYNAMIC LAUNCH POPUP ANNOUNCEMENT */}
        {isCurrencyModalOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4" onClick={() => setIsCurrencyModalOpen(false)}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-[320px] rounded-3xl p-5 space-y-4 animate-scale-up shadow-2xl relative text-left border border-neutral-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">কারেন্সি নির্বাচন করুন (Select Currency)</h3>
                <button onClick={() => setIsCurrencyModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setShowForeignCurrency(false);
                    setIsCurrencyModalOpen(false);
                    playAudio('click');
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${!showForeignCurrency ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-neutral-50 border-neutral-100 hover:bg-neutral-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-750'}`}
                >
                  <p className={`text-xs font-black ${!showForeignCurrency ? 'text-indigo-700 dark:text-indigo-400' : 'text-neutral-700 dark:text-slate-300'}`}>৳ BDT (টাকা)</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">ডিফল্ট বাংলাদেশি টাকা</p>
                </button>
                {globalCurrencies.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setGlobalCurrencyName(c.name);
                      setGlobalCurrencyRate(c.rate);
                      setShowForeignCurrency(true);
                      setIsCurrencyModalOpen(false);
                      playAudio('click');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${showForeignCurrency && globalCurrencyName === c.name ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-neutral-50 border-neutral-100 hover:bg-neutral-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-750'}`}
                  >
                    <p className={`text-xs font-black uppercase ${showForeignCurrency && globalCurrencyName === c.name ? 'text-indigo-700 dark:text-indigo-400' : 'text-neutral-700 dark:text-slate-300'}`}>{c.name}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5 font-mono">1 {c.name} = {c.rate} BDT</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePopup && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
            <div className="bg-white w-full max-w-[360px] rounded-3xl p-5 space-y-4 animate-scale-up shadow-2xl relative text-left border border-neutral-100">
              
              {/* Header with colorful badge */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="bg-rose-50 text-rose-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-rose-100 tracking-wider">
                    ঘোষণা / Announcement
                  </span>
                  <h3 className="text-sm font-extrabold text-neutral-900 leading-tight">
                    {activePopup.title}
                  </h3>
                </div>
                <button 
                  onClick={handleClosePopup}
                  className="p-1 hover:bg-neutral-50 rounded-full transition-colors cursor-pointer text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Optional Notification Image */}
              {activePopup.imageUrl && (
                <div className="w-full h-36 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-150">
                  <img 
                    src={activePopup.imageUrl} 
                    alt={activePopup.title} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover" 
                  />
                </div>
              )}

              {/* Message Body */}
              <p className="text-xs text-neutral-600 font-medium leading-relaxed whitespace-pre-line">
                {activePopup.body}
              </p>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClosePopup}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs flex items-center justify-center cursor-pointer transition-all active:scale-98 shadow-xs hover:shadow-md"
                >
                  ঠিক আছে / Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* 7. PUSH NOTIFICATION SETTINGS MODAL */}
        <PushNotificationModal 
          isOpen={isPushModalOpen}
          onClose={() => setIsPushModalOpen(false)}
          notificationsList={notificationsList}
          userPhone={user?.phone}
          userId={user?.id}
          user={user}
          theme={theme}
        />

        {/* 8. STATEMENT / REPORT GENERATOR MODAL */}
        {isStatementModalOpen && (
          <StatementModal
            user={user}
            orders={orders}
            theme={theme}
            onClose={() => setIsStatementModalOpen(false)}
          />
        )}

      </div>
    </div>
  );
}
