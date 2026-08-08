import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  X, 
  ShieldCheck, 
  Trash2, 
  Sparkles,
  Megaphone
} from 'lucide-react';
import { 
  collection, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  getNotificationPermissionState, 
  requestNotificationPermission, 
  NotificationPermissionState 
} from '../utils/serviceWorkerRegistration';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

interface PushNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationsList?: any[];
  userPhone?: string;
  userId?: string;
  user?: any;
  theme?: 'light' | 'dark';
}

function formatNotificationTime(rawDate?: any) {
  if (!rawDate) return 'এইমাত্র';
  try {
    let d: Date;
    if (rawDate && typeof rawDate.toDate === 'function') {
      d = rawDate.toDate();
    } else {
      d = new Date(rawDate);
    }
    if (isNaN(d.getTime())) return typeof rawDate === 'string' ? rawDate : 'এইমাত্র';
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'এইমাত্র';
    if (diffMins < 60) return `${diffMins} মি. আগে`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;

    return d.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return typeof rawDate === 'string' ? rawDate : 'এইমাত্র';
  }
}

function getNotificationDetails(notif: any) {
  const typeStr = (notif.type || notif.notifType || notif.status || '').toLowerCase();
  const titleStr = (notif.title || '').toLowerCase();
  const bodyStr = (notif.message || notif.body || '').toLowerCase();

  const isPending = typeStr === 'pending' || 
                    titleStr.includes('pending') || 
                    bodyStr.includes('pending') || 
                    titleStr.includes('পেন্ডিং') || 
                    bodyStr.includes('পেন্ডিং');

  const isSuccess = typeStr === 'success' || 
                    titleStr.includes('completed') || 
                    bodyStr.includes('completed') || 
                    titleStr.includes('সফল') || 
                    bodyStr.includes('সফল') || 
                    titleStr.includes('অনুমোদিত');

  if (isPending) {
    return {
      category: 'Pending' as const,
      badgeLabel: 'Pending 🟡',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      dotClass: 'bg-amber-500 animate-pulse',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: Clock,
    };
  }

  if (isSuccess) {
    return {
      category: 'Success' as const,
      badgeLabel: 'Success 🟢',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      dotClass: 'bg-emerald-500',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
    };
  }

  return {
    category: 'Admin Alert' as const,
    badgeLabel: 'Admin Alert 🔵',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    dotClass: 'bg-blue-500',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Megaphone,
  };
}

export default function PushNotificationModal({
  isOpen,
  onClose,
  notificationsList = [],
  userPhone,
  userId,
  user,
  theme = 'light'
}: PushNotificationModalProps) {
  const [permState, setPermState] = useState<NotificationPermissionState>(getNotificationPermissionState());
  const [realtimeNotifs, setRealtimeNotifs] = useState<any[]>([]);
  
  // Dismissed notifications saved in local storage
  const [dismissedList, setDismissedList] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    } catch {
      return [];
    }
  });

  const targetUserId = userId || user?.id;
  const targetPhone = userPhone || user?.phone;

  // Real-time Firestore Stream for User Notifications
  useEffect(() => {
    if (!isOpen) return;
    setPermState(getNotificationPermissionState());

    try {
      setDismissedList(JSON.parse(localStorage.getItem('dismissed_notifications') || '[]'));
    } catch (e) {
      console.error("Failed to load dismissed notifications", e);
    }

    const notifMap = new Map<string, any>();

    const updateNotifState = () => {
      const merged = Array.from(notifMap.values());
      merged.sort((a, b) => {
        const getMs = (val: any) => {
          if (!val) return 0;
          if (val.createdAt) {
            if (typeof val.createdAt.toDate === 'function') {
              return val.createdAt.toDate().getTime();
            }
            return new Date(val.createdAt).getTime();
          }
          if (val.date) {
            return new Date(val.date).getTime();
          }
          return 0;
        };
        return getMs(b) - getMs(a);
      });
      setRealtimeNotifs(merged);
    };

    // Standard list from initial props
    if (Array.isArray(notificationsList)) {
      notificationsList.forEach(n => {
        if (n && n.id) notifMap.set(n.id, n);
      });
      updateNotifState();
    }

    // Stream 1: Root `notifications` collection
    const notifColRef = collection(db, "notifications");
    const unsubRoot = onSnapshot(notifColRef, (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const data = { ...docSnap.data(), id: docSnap.id };
        notifMap.set(docSnap.id, data);
      });
      updateNotifState();
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "notifications");
    });

    // Stream 2: `users/{userId}/notifications` subcollection if logged in, ordered by createdAt desc
    let unsubUser: (() => void) | null = null;
    if (targetUserId) {
      const userNotifColRef = collection(db, "users", targetUserId, "notifications");
      const q = query(userNotifColRef, orderBy("createdAt", "desc"));
      unsubUser = onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          const data = { ...docSnap.data(), id: docSnap.id };
          notifMap.set(docSnap.id, data);
        });
        updateNotifState();
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${targetUserId}/notifications`);
      });
    }

    return () => {
      unsubRoot();
      if (unsubUser) unsubUser();
    };
  }, [isOpen, targetUserId, targetPhone, notificationsList]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    await requestNotificationPermission();
    setPermState(getNotificationPermissionState());
  };

  // Helper to normalize phone numbers for reliable comparison
  const cleanPhone = (p?: string) => (p ? p.replace(/\D/g, '').slice(-11) : '');

  // Filter notifications relevant to current user
  const relevantNotifications = realtimeNotifs.filter((n: any) => {
    if (!n) return false;
    
    // If notification is targeted to a specific phone number
    if (n.targetPhone) {
      const targetP = cleanPhone(n.targetPhone);
      const userP = cleanPhone(targetPhone);
      if (targetP && userP && targetP !== userP) {
        return false;
      }
    }

    // If notification is targeted to a specific role (and not 'All')
    if (n.targetRole && n.targetRole !== 'All') {
      const userRole = user?.role || 'Retailer';
      if (userRole !== 'Admin' && n.targetRole !== userRole) {
        return false;
      }
    }

    return true;
  });

  // Filter out dismissed notifications
  const activeNotifications = relevantNotifications.filter((n: any) => !dismissedList.includes(n.id));

  const handleDismissNotification = (id: string) => {
    const updated = [...dismissedList, id];
    setDismissedList(updated);
    try {
      localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = () => {
    const allIds = relevantNotifications.map((n: any) => n.id);
    const updated = Array.from(new Set([...dismissedList, ...allIds]));
    setDismissedList(updated);
    try {
      localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all ${
          isDark 
            ? 'bg-slate-950 border-slate-800 text-white' 
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header - Clean, No Technical Jargon */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-neutral-100 bg-neutral-50/90'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-2xl ${
              isDark ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-800/50' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
            }`}>
              <Bell className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight flex items-center gap-2">
                <span>নোটিফিকেশন সেন্টার</span>
                {activeNotifications.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-indigo-600 text-white">
                    {activeNotifications.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400 font-medium">আপনার লাইভ অর্ডার আপডেট ও ঘোষণা</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {permState.permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800/50"
                title="ব্রাউজার পুশ নোটিফিকেশন চালু করুন"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">পুশ পারমিশন</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-neutral-200/60 text-neutral-500'
              }`}
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          {/* Top Bar for Clear All */}
          {activeNotifications.length > 0 && (
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold text-neutral-400 tracking-wider uppercase">
                মেসেজ তালিকা ({activeNotifications.length})
              </span>
              <button
                onClick={handleClearAll}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer px-2.5 py-1 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl border border-rose-200 dark:border-rose-800/40 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>সব মুছুন</span>
              </button>
            </div>
          )}

          {activeNotifications.length === 0 ? (
            <div className="py-14 px-4 text-center space-y-3">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto ${
                isDark ? 'bg-slate-900 text-slate-500 border border-slate-800' : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
              }`}>
                <BellOff className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">কোনো নোটিফিকেশন নেই</h4>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  আপনার নতুন অর্ডারের লাইভ স্ট্যাটাস এবং এডমিন এলার্ট এখানে স্বয়ংক্রিয়ভাবে চলে আসবে।
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {activeNotifications.map((n: any) => {
                const details = getNotificationDetails(n);
                const IconComponent = details.icon;
                const formattedTime = formatNotificationTime(n.createdAt || n.date);

                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all relative group flex items-start space-x-3.5 ${
                      isDark
                        ? 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700 shadow-sm'
                        : 'bg-white border-neutral-200/90 hover:border-neutral-300 shadow-xs'
                    }`}
                  >
                    {/* Styled Status Icon Container */}
                    <div className={`p-2.5 rounded-xl shrink-0 border ${details.iconBg}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 min-w-0 pr-6 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Colored Badge (Pending 🟡, Success 🟢, Admin Alert 🔵) */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${details.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${details.dotClass}`}></span>
                          {details.badgeLabel}
                        </span>

                        <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {formattedTime}
                        </span>
                      </div>

                      <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {n.title}
                      </h5>

                      {(n.message || n.body) && (
                        <p className="text-xs text-neutral-600 dark:text-slate-300 leading-relaxed font-normal">
                          {n.message || n.body}
                        </p>
                      )}
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={() => handleDismissNotification(n.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                      title="মুছে ফেলুন"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
