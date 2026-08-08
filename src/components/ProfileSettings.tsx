import React, { useState, useEffect } from 'react';
import { User, Order, SupportTicket } from '../types';
import { ShieldCheck, UserCheck, ShieldAlert, KeyRound, Receipt, Ticket, Calendar, CheckCircle2, AlertCircle, Printer, X, Bell, Send } from 'lucide-react';
import { getNotificationPermissionState, requestNotificationPermission, triggerTestPushNotification, NotificationPermissionState } from '../utils/serviceWorkerRegistration';

interface ProfileSettingsProps {
  user: User;
  orders: Order[];
  tickets: SupportTicket[];
  onRefresh: () => void;
  theme?: 'light' | 'dark';
  onToggleAdminMode?: () => void;
}

export default function ProfileSettings({ user, orders, tickets, onRefresh, theme = 'light', onToggleAdminMode }: ProfileSettingsProps) {
  // Navigation Tabs inside Profile Settings
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'history' | 'tickets'>('profile');

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>(user.name);
  const [profileEmail, setProfileEmail] = useState<string>(user.email);
  const [profilePic, setProfilePic] = useState<string>(user.profilePic);
  const [profileError, setProfileError] = useState<string>('');
  const [profileSuccess, setProfileSuccess] = useState<string>('');

  // Change Password States
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [passError, setPassError] = useState<string>('');
  const [passSuccess, setPassSuccess] = useState<string>('');

  // Change PIN States
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [pinSuccess, setPinSuccess] = useState<string>('');

  // Invoice / Receipt State
  const [selectedInvoice, setSelectedInvoice] = useState<Order | null>(null);

  // Push Notification States
  const [swPermState, setSwPermState] = useState<NotificationPermissionState>(getNotificationPermissionState());
  const [swTestResult, setSwTestResult] = useState<string | null>(null);

  useEffect(() => {
    setSwPermState(getNotificationPermissionState());
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, email: profileEmail, profilePic })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'প্রোফাইল আপডেট করা যায়নি।');
      setProfileSuccess('প্রোফাইল সফলভাবে আপডেট হয়েছে!');
      setTimeout(() => setIsEditingProfile(false), 1500);
      onRefresh();
    } catch (err: any) {
      setProfileError(err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 6) {
      setPassError('পাসওয়ার্ড কমপক্ষে ৬ ডিজিটের হতে হবে।');
      return;
    }

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPassSuccess('পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPassError(err.message);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (newPin.length < 4) {
      setPinError('পিন কমপক্ষে ৪ ডিজিটের হতে হবে।');
      return;
    }

    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/user/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPin, newPin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPinSuccess('সিকিউরিটি পিন সফলভাবে পরিবর্তিত হয়েছে!');
      setOldPin('');
      setNewPin('');
    } catch (err: any) {
      setPinError(err.message);
    }
  };

  const getCommissionRate = () => {
    if (user.role === 'VIP') return '3% (VIP Commission)';
    if (user.role === 'Sub-Admin') return '2% (Sub-Admin Commission)';
    return '1% (Retailer Commission)';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl mx-auto">
      
      {/* LEFT COLUMN - Profile Card & Quick Tabs */}
      <div className="md:col-span-4 space-y-5">
        {/* Profile Card */}
        <div className={`rounded-2xl border p-5 shadow-3xs flex flex-col items-center text-center space-y-4 ${
          theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white border-neutral-200 text-neutral-900'
        }`}>
          <div className="relative">
            <img
              src={user.profilePic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
              alt={user.name}
              className={`w-20 h-20 rounded-full object-cover border ${theme === 'dark' ? 'border-slate-800' : 'border-neutral-200'}`}
            />
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <div className="space-y-1">
            <h3 className={`text-sm font-bold leading-tight ${theme === 'dark' ? 'text-slate-100' : 'text-neutral-900'}`}>{user.name}</h3>
            <p className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>{user.email}</p>
            <div className="pt-1.5 flex justify-center">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                theme === 'dark' ? 'bg-cyan-500 text-slate-950' : 'bg-neutral-950 text-white'
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Quick wallet balance metric */}
          <div className={`w-full border rounded-xl p-3 flex justify-between items-center text-left ${
            theme === 'dark' ? 'bg-slate-950/40 border-slate-800/60' : 'bg-neutral-50 border-neutral-200/50'
          }`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>ওয়ালেট ব্যালেন্স</p>
              <h4 className={`text-lg font-black ${theme === 'dark' ? 'text-cyan-400' : 'text-indigo-600'}`}>৳{user.walletBalance} BDT</h4>
            </div>
            <div className="text-right">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>কমিশন লেভেল</p>
              <span className={`text-[11px] font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}`}>{getCommissionRate()}</span>
            </div>
          </div>

          <button
            onClick={() => setIsEditingProfile(true)}
            className={`w-full py-2 border rounded-lg text-xs font-black transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
            }`}
          >
            প্রোফাইল সংশোধন করুন
          </button>
        </div>

        {/* Support Tab Navigation */}
        <div className={`rounded-2xl border p-2.5 shadow-3xs flex flex-col space-y-1.5 ${
          theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-neutral-200'
        }`}>
          {[
            { id: 'profile', label: 'ব্যক্তিগত তথ্য', icon: UserCheck },
            { id: 'security', label: 'সিকিউরিটি সেটিংস', icon: ShieldCheck },
            { id: 'history', label: 'লেনদেনের ইতিহাস', icon: Receipt },
            { id: 'tickets', label: 'টিকিট হিস্ট্রি', icon: Ticket }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2.5 cursor-pointer active:scale-98 ${
                  isSel 
                    ? theme === 'dark' 
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/10' 
                      : 'bg-neutral-950 text-white shadow-xs' 
                    : theme === 'dark'
                      ? 'text-slate-400 hover:bg-slate-950/40 hover:text-slate-200'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {(user.role === 'Admin' || user.role === 'Sub-Admin') && onToggleAdminMode && (
            <button
              onClick={onToggleAdminMode}
              className="w-full py-2.5 px-3.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2.5 cursor-pointer bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm mt-2 active:scale-98"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-slate-950" />
              <span>এডমিন প্যানেলে যান (Admin Mode)</span>
            </button>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN - Tab Panel Display */}
      <div className={`md:col-span-8 p-6 rounded-2xl border shadow-3xs text-left ${
        theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-neutral-200'
      }`}>
        
        {/* 1. PERSONAL PROFILE INFO TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className={`border-b pb-3 ${theme === 'dark' ? 'border-slate-850' : 'border-neutral-100'}`}>
              <h3 className={`text-sm font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>সদস্য তথ্য পরিচিতি (User Account Profile)</h3>
              <p className={`text-[10px] font-semibold mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>রিসেলার লেভেল এবং কমিশন স্ট্রাকচার</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border space-y-1 ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-800/60' : 'bg-neutral-50 border-neutral-200/50'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>রিসেলার মেম্বারশিপ</span>
                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>{user.role} মেম্বারশিপ</p>
              </div>
              <div className={`p-4 rounded-xl border space-y-1 ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-800/60' : 'bg-neutral-50 border-neutral-200/50'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>মোবাইল নম্বর</span>
                <p className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>{user.phone}</p>
              </div>
              <div className={`p-4 rounded-xl border space-y-1 ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-800/60' : 'bg-neutral-50 border-neutral-200/50'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>অ্যাড মানি কমিশন রেট</span>
                <p className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>{getCommissionRate()}</p>
              </div>
              <div className={`p-4 rounded-xl border space-y-1 ${
                theme === 'dark' ? 'bg-slate-950/40 border-slate-800/60' : 'bg-neutral-50 border-neutral-200/50'
              }`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>ইমেইল ঠিকানা</span>
                <p className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>{user.email}</p>
              </div>
            </div>

            <div className={`rounded-xl p-4 space-y-2 border ${
              theme === 'dark' ? 'bg-slate-950/40 border-slate-800/60 text-slate-300' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-800'}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>লেভেল কমিশন বিবরণী</span>
              </h4>
              <p className={`text-xs leading-normal font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
                টেলিকম প্ল্যাটফর্মের রোল-ভিত্তিক কমিশন অনুযায়ী প্রতিবার বিকাশ/নগদ/রকেটে সফলভাবে <b>Add Money</b> আবেদন অনুমোদিত হলে আপনি আপনার রোল অনুযায়ী বোনাস পাবেন:
                <br />
                <span className={`font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-neutral-800'}`}>VIP: 3% কমিশন</span> | <span className={`font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-neutral-800'}`}>Sub-Admin: 2% কমিশন</span> | <span className={`font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-neutral-800'}`}>Retailer: 1% কমিশন</span>
              </p>
            </div>
          </div>
        )}

        {/* 2. SECURITY SETTINGS TAB */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className={`border-b pb-3 ${theme === 'dark' ? 'border-slate-850' : 'border-neutral-100'}`}>
              <h3 className={`text-sm font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>সিকিউরিটি সেটিংস (Security Settings)</h3>
              <p className={`text-[10px] font-semibold mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>আপনার ওয়ালেট পিন ও পাসওয়ার্ড সংশোধন করুন</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form 1: Password Change */}
              <form onSubmit={handleChangePassword} className={`space-y-4 pr-0 md:pr-6 md:border-r ${theme === 'dark' ? 'border-slate-850' : 'border-neutral-100'}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>
                  <KeyRound className="w-4 h-4 text-neutral-500" />
                  <span>পাসওয়ার্ড পরিবর্তন (Change Password)</span>
                </h4>

                <div className="flex flex-col space-y-1">
                  <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>বর্তমান পাসওয়ার্ড</label>
                  <input
                    type="password"
                    required
                    placeholder="বর্তমান পাসওয়ার্ড"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className={`p-2.5 border rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-medium ${
                      theme === 'dark'
                        ? 'bg-slate-950 border-slate-850 text-slate-100 placeholder-slate-700'
                        : 'bg-white border-neutral-250 text-neutral-800 placeholder-neutral-400'
                    }`}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>নতুন পাসওয়ার্ড</label>
                  <input
                    type="password"
                    required
                    placeholder="কমপক্ষে ৬ ডিজিট"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`p-2.5 border rounded-lg text-xs focus:outline-none focus:border-indigo-500 font-medium ${
                      theme === 'dark'
                        ? 'bg-slate-950 border-slate-850 text-slate-100 placeholder-slate-700'
                        : 'bg-white border-neutral-250 text-neutral-800 placeholder-neutral-400'
                    }`}
                  />
                </div>

                {passError && <p className="text-[10px] text-rose-500 font-bold bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{passError}</p>}
                {passSuccess && <p className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">{passSuccess}</p>}

                <button
                  type="submit"
                  className={`w-full py-2.5 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-600'
                      : 'bg-neutral-950 hover:bg-neutral-900 text-white shadow-xs'
                  }`}
                >
                  পাসওয়ার্ড পরিবর্তন করুন
                </button>
              </form>

              {/* Form 2: PIN Change */}
              <form onSubmit={handleChangePin} className="space-y-4">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>
                  <ShieldCheck className="w-4 h-4 text-neutral-500" />
                  <span>সিকিউরিটি পিন পরিবর্তন (Change PIN)</span>
                </h4>

                <div className="flex flex-col space-y-1">
                  <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>বর্তমান সিকিউরিটি পিন</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="••••"
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value)}
                    className={`p-2.5 border rounded-lg text-xs text-center tracking-widest focus:outline-none focus:border-indigo-500 font-extrabold ${
                      theme === 'dark'
                        ? 'bg-slate-950 border-slate-850 text-slate-100 placeholder-slate-700'
                        : 'bg-white border-neutral-250 text-neutral-800 placeholder-neutral-400'
                    }`}
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>নতুন সিকিউরিটি পিন</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className={`p-2.5 border rounded-lg text-xs text-center tracking-widest focus:outline-none focus:border-indigo-500 font-extrabold ${
                      theme === 'dark'
                        ? 'bg-slate-950 border-slate-850 text-slate-100 placeholder-slate-700'
                        : 'bg-white border-neutral-250 text-neutral-800 placeholder-neutral-400'
                    }`}
                  />
                </div>

                {pinError && <p className="text-[10px] text-rose-500 font-bold bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{pinError}</p>}
                {pinSuccess && <p className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">{pinSuccess}</p>}

                <button
                  type="submit"
                  className={`w-full py-2.5 text-xs font-black rounded-lg transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-600'
                      : 'bg-neutral-950 hover:bg-neutral-900 text-white shadow-xs'
                  }`}
                >
                  পিন পরিবর্তন করুন
                </button>
              </form>
            </div>

            {/* Browser Push Notification Card */}
            <div className={`rounded-xl p-4 border space-y-3 ${
              theme === 'dark' ? 'bg-slate-950/40 border-slate-800/60' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-indigo-50 text-indigo-700'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>লেনদেন ব্রাউজার পুশ নোটিফিকেশন (Service Worker Push)</h4>
                    <p className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-500'}`}>অর্ডার অনুমোদন/বাতিল হলে সরাসরি সিস্টেম নোটিফিকেশন পাবেন</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  swPermState.permission === 'granted' 
                    ? theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-800' 
                    : theme === 'dark' ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-800'
                }`}>
                  {swPermState.permission === 'granted' ? 'Active' : 'Disabled'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {swPermState.permission !== 'granted' && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await requestNotificationPermission();
                      setSwPermState(getNotificationPermissionState());
                      if (res === 'granted') setSwTestResult('🎉 ব্রাউজার নোটিফিকেশন সফলভাবে এনাবল করা হয়েছে!');
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1 ${
                      theme === 'dark' ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-600' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>নোটিফিকেশন পারমিশন এলাউ করুন</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    const ok = await triggerTestPushNotification();
                    setSwPermState(getNotificationPermissionState());
                    if (ok) setSwTestResult('✅ সার্ভিস ওয়ার্কার টেস্ট পুশ নোটিফিকেশন প্রেরিত হয়েছে!');
                    else setSwTestResult('⚠️ পারমিশন প্রয়োজন।');
                  }}
                  className={`px-3 py-1.5 border text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1 ${
                    theme === 'dark'
                      ? 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-200'
                      : 'bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-800'
                  }`}
                >
                  <Send className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-cyan-400' : 'text-indigo-600'}`} />
                  <span>টেস্ট পুশ পাঠান (Test Notification)</span>
                </button>
              </div>

              {swTestResult && (
                <p className={`text-[10px] font-bold p-2 rounded-lg border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-white border-neutral-200 text-neutral-700'
                }`}>
                  {swTestResult}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 3. TRANSACTION HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className={`border-b pb-3 ${theme === 'dark' ? 'border-slate-850' : 'border-neutral-100'}`}>
              <h3 className={`text-sm font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>সম্পূর্ণ লেনদেন ও ইনভয়েস ইতিহাস</h3>
              <p className={`text-[10px] font-semibold mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>সবগুলো Add Money, Recharge, এবং Bank Transfer এর খতিয়ান</p>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 font-medium">কোনো লেনদেন পাওয়া যায়নি।</div>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className={`border rounded-2xl p-4 flex justify-between items-center transition-all shadow-3xs ${
                    theme === 'dark'
                      ? 'bg-slate-950/30 border-slate-850 hover:border-slate-750'
                      : 'bg-white border-neutral-200/80 hover:border-neutral-350'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono font-black text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-900'}`}>{ord.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          ord.type === 'Add Money' ? 'bg-indigo-500/10 text-indigo-400' :
                          ord.type === 'Drive Pack' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-rose-500/10 text-rose-400'
                        }`}>
                          {ord.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded-[5px] text-[9px] font-bold border ${
                          ord.status === 'Success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          ord.status === 'Pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {ord.status === 'Success' ? 'সফল' : ord.status === 'Pending' ? 'পেন্ডিং' : 'বাতিল'}
                        </span>
                      </div>
                      <p className={`text-xs font-bold leading-tight ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-800'}`}>
                        {ord.serviceName} {ord.paymentMethod ? `(${ord.paymentMethod})` : ''}
                      </p>
                      <div className="flex items-center space-x-3 text-[10px] text-neutral-400 font-semibold">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          <span>{new Date(ord.date).toLocaleDateString()}</span>
                        </span>
                        {ord.userPhone && <span>নম্বর: {ord.userPhone}</span>}
                      </div>

                      {ord.cancellationReason && (
                        <p className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                          বাতিলের কারণ: {ord.cancellationReason}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-2 shrink-0">
                      <p className={`text-sm font-extrabold ${theme === 'dark' ? 'text-slate-100' : 'text-neutral-900'}`}>৳{ord.amount} BDT</p>
                      <button
                        onClick={() => setSelectedInvoice(ord)}
                        className={`flex items-center space-x-1 text-[10px] font-black px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                        }`}
                      >
                        <Printer className="w-3 h-3" />
                        <span>রসিদ মুদ্রণ</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. TICKET HISTORY TAB */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className={`border-b pb-3 ${theme === 'dark' ? 'border-slate-850' : 'border-neutral-100'}`}>
              <h3 className={`text-sm font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>আমার টিকিট হিস্ট্রি (Support Ticket History)</h3>
              <p className={`text-[10px] font-semibold mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>আপনার উত্থাপিত সাপোর্ট টিকেটসমূহের স্ট্যাটাস ট্র্যাক করুন</p>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {tickets.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 font-medium">কোনো টিকিট পাওয়া যায়নি।</div>
              ) : (
                tickets.map((t) => (
                  <div key={t.id} className={`border rounded-2xl p-4 flex justify-between items-start transition-all shadow-3xs ${
                    theme === 'dark'
                      ? 'bg-slate-950/30 border-slate-850 hover:border-slate-750'
                      : 'bg-white border-neutral-200/80 hover:border-neutral-350'
                  }`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono font-bold text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-800'}`}>{t.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          t.status === 'Pending' 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {t.status === 'Pending' ? 'পেন্ডিং' : 'সমাধানকৃত'}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-semibold">{new Date(t.date).toLocaleDateString()}</span>
                      </div>
                      <p className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>{t.subject}</p>
                      <p className={`text-[11px] leading-normal font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>{t.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-3xs">
          <form onSubmit={handleUpdateProfile} className={`rounded-2xl border p-6 max-w-md w-full shadow-xl space-y-4 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-neutral-200 text-neutral-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${theme === 'dark' ? 'border-slate-850' : 'border-neutral-100'}`}>
              <h3 className="text-sm font-black uppercase tracking-wider">প্রোফাইল সেটিংস</h3>
              <button type="button" onClick={() => setIsEditingProfile(false)} className="text-neutral-400 hover:text-neutral-900 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-700'}`}>নাম (Name)</label>
                <input
                  type="text"
                  required
                  placeholder="আপনার নাম"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className={`w-full text-xs p-3 border rounded-lg focus:outline-none focus:border-indigo-500 font-bold ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-850 text-slate-100'
                      : 'bg-white border-neutral-250 text-neutral-850 font-bold'
                  }`}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-700'}`}>ইমেইল (Email)</label>
                <input
                  type="email"
                  required
                  placeholder="আপনার ইমেইল"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className={`w-full text-xs p-3 border rounded-lg focus:outline-none focus:border-indigo-500 font-medium ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-850 text-slate-100'
                      : 'bg-white border-neutral-250 text-neutral-850'
                  }`}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-700'}`}>প্রোফাইল পিকচার লিংক (URL)</label>
                <input
                  type="url"
                  placeholder="ছবি এর ইউআরএল লিংক"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  className={`w-full text-xs p-3 border rounded-lg focus:outline-none focus:border-indigo-500 ${
                    theme === 'dark'
                      ? 'bg-slate-950 border-slate-850 text-slate-100'
                      : 'bg-white border-neutral-250 text-neutral-850'
                  }`}
                />
              </div>
            </div>

            {profileError && <p className="text-xs text-rose-500 font-bold bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">{profileError}</p>}
            {profileSuccess && <p className="text-xs text-emerald-500 font-bold bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">{profileSuccess}</p>}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                  theme === 'dark'
                    ? 'border-slate-800 text-slate-400 hover:bg-slate-950/40'
                    : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                className={`flex-1 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-600 font-black'
                    : 'bg-neutral-950 hover:bg-neutral-900 text-white font-bold'
                }`}
              >
                আপডেট করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRINTABLE INVOICE / RECEIPT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-3xs">
          <div className={`rounded-2xl border p-6 max-w-lg w-full shadow-2xl space-y-6 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-neutral-200 text-neutral-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 shrink-0 ${theme === 'dark' ? 'border-slate-850' : 'border-neutral-100'}`}>
              <span className={`text-[10px] font-extrabold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>অফিসিয়াল মানি রসিদ (Official Invoice)</span>
              <button 
                onClick={() => setSelectedInvoice(null)} 
                className="text-neutral-400 hover:text-neutral-900 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invoice Design */}
            <div id="printable-area" className={`space-y-6 border p-5 rounded-2xl ${
              theme === 'dark' ? 'bg-slate-950/40 border-slate-850' : 'bg-neutral-50/30 border-neutral-200/80'
            }`}>
              {/* Header */}
              <div className={`flex justify-between items-start border-b border-dashed pb-4 ${theme === 'dark' ? 'border-slate-800' : 'border-neutral-200'}`}>
                <div className="space-y-1">
                  <h2 className={`text-base font-serif-display font-black tracking-tight ${theme === 'dark' ? 'text-slate-100' : 'text-neutral-900'}`}>টেলিকম রিসেলার ও এমএফএস</h2>
                  <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Platform Money Receipt</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className={`text-xs font-extrabold font-mono ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-800'}`}>INV-{selectedInvoice.id}</p>
                  <p className="text-[9px] text-neutral-400 font-bold">{new Date(selectedInvoice.date).toLocaleString('bn-BD')}</p>
                </div>
              </div>

              {/* Status Ribbon */}
              <div className={`flex justify-between items-center border p-3 rounded-xl ${
                theme === 'dark' ? 'bg-slate-950/60 border-slate-850' : 'bg-white border-neutral-200'
              }`}>
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold uppercase">পেমেন্ট স্ট্যাটাস</span>
                  <p className="text-xs font-bold text-emerald-500 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedInvoice.status === 'Success' ? 'সফল (Success)' : selectedInvoice.status === 'Pending' ? 'পেন্ডিং' : 'বাতিল'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase">পরিমাণ BDT</span>
                  <p className={`text-sm font-black ${theme === 'dark' ? 'text-slate-100' : 'text-neutral-900'}`}>৳{selectedInvoice.amount} BDT</p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="space-y-2">
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">লেনদেনের সুনির্দিষ্ট বিবরণ:</span>
                <div className={`border rounded-xl divide-y text-xs ${
                  theme === 'dark' ? 'bg-slate-950/40 border-slate-850 divide-slate-850' : 'bg-white border-neutral-200 divide-neutral-100'
                }`}>
                  <div className="p-3 flex justify-between">
                    <span className="text-neutral-400 font-semibold">গ্রাহকের মোবাইল:</span>
                    <span className={`font-bold font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-800'}`}>{selectedInvoice.userPhone}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-neutral-400 font-semibold">সার্ভিসের নাম:</span>
                    <span className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-800'}`}>{selectedInvoice.serviceName} {selectedInvoice.paymentMethod ? `(${selectedInvoice.paymentMethod})` : ''}</span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-neutral-400 font-semibold">লেনদেনের ধরণ:</span>
                    <span className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-800'}`}>{selectedInvoice.type}</span>
                  </div>
                  {selectedInvoice.trxId && (
                    <div className="p-3 flex justify-between">
                      <span className="text-neutral-400 font-semibold">ট্রানজেকশন ID:</span>
                      <span className={`font-bold font-mono uppercase ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-800'}`}>{selectedInvoice.trxId}</span>
                    </div>
                  )}
                  {selectedInvoice.account && (
                    <div className="p-3 flex justify-between">
                      <span className="text-neutral-400 font-semibold">টার্গেট অ্যাকাউন্ট:</span>
                      <span className={`font-bold font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-800'}`}>{selectedInvoice.account}</span>
                    </div>
                  )}
                  {selectedInvoice.commissionDeducted > 0 && (
                    <div className={`p-3 flex justify-between ${theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50/40'}`}>
                      <span className="text-emerald-500 font-bold">লেভেল ক্যাশব্যাক বোনাস:</span>
                      <span className="text-emerald-500 font-bold font-mono">+৳{selectedInvoice.commissionDeducted} BDT</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2">
                <p className="text-[9px] text-neutral-400 font-bold">টেলিকম প্ল্যাটফর্মের সাথে থাকার জন্য ধন্যবাদ। এটি একটি সিস্টেম জেনারেটেড রসিদ।</p>
              </div>
            </div>

            {/* Print Button Options */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setSelectedInvoice(null)}
                className={`flex-1 py-3 text-xs border font-bold rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'border-slate-800 text-slate-400 hover:bg-slate-950/40'
                    : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => window.print()}
                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all shadow flex items-center justify-center space-x-2 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-600'
                    : 'bg-neutral-950 hover:bg-neutral-900 text-white'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>রসিদ প্রিন্ট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
