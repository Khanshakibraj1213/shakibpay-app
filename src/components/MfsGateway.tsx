import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, ChevronDown, Copy, ShieldCheck, HelpCircle } from 'lucide-react';
import { User } from '../types';
import { generateReceiptCanvas } from '../utils/receiptGenerator';

interface MfsGatewayProps {
  showForeignCurrency?: boolean;
  globalCurrencyName?: string;
  globalCurrencyRate?: number;
  onBack: () => void;
  user: User;
  onOrderCreated: (createdOrder?: any) => void;
  theme?: 'light' | 'dark';
  initialProvider?: 'bkash' | 'nagad' | 'rocket' | 'banking';
}

export default function MfsGateway({ onBack, user, onOrderCreated, theme = 'light', initialProvider , showForeignCurrency, globalCurrencyName, globalCurrencyRate}: MfsGatewayProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Admin numbers state
  const [adminNums, setAdminNums] = useState({
    bkash: '01635275233',
    nagad: '01635275233',
    rocket: '01635275233',
    usdt: 'TRC20: TVgJ...'
  });

  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<'বিকাশ' | 'নগদ' | 'রকেট' | 'ব্যাংক' | 'USDT'>(() => {
    if (initialProvider === 'nagad') return 'নগদ';
    if (initialProvider === 'rocket') return 'রকেট';
    if (initialProvider === 'banking') return 'ব্যাংক';
    return 'বিকাশ';
  });

  // Form Fields
  const [amount, setAmount] = useState<string>('');
  const [senderPhone, setSenderPhone] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Security PIN state & modal
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [securityPin, setSecurityPin] = useState<string>('');

  // Fetch admin numbers on mount
  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/admin/info')
      .then(res => res.json())
      .then(data => {
        if (data && data.adminNumbers) {
          setAdminNums({
            bkash: data.adminNumbers.bkash?.personal || '01635275233',
            nagad: data.adminNumbers.nagad?.personal || '01635275233',
            rocket: data.adminNumbers.rocket?.personal || '01635275233',
            usdt: data.adminNumbers.usdt?.personal || 'TRC20: TVgJ...'
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleCopy = (num: string, type: string) => {
    navigator.clipboard.writeText(num);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleOpenPinModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) < 10) {
      setErrorMsg('নূন্যতম ১০ টাকা অ্যাড মানি করতে পারবেন।');
      return;
    }
    if (selectedService !== 'ব্যাংক' && (!senderPhone || senderPhone.length < 11)) {
      setErrorMsg('টাকা পাঠানোর সঠিক নম্বর প্রদান করুন (১১ ডিজিট)।');
      return;
    }
    if (selectedService === 'ব্যাংক' && (!senderPhone || senderPhone.length < 4)) {
      setErrorMsg('সঠিক প্রেরক ব্যাংক হিসাব নম্বর প্রদান করুন।');
      return;
    }
    if (!trxId || trxId.trim().length < 4) {
      setErrorMsg('সঠিক ট্রানজেকশন আইডি (TrxID) বা প্রমাণপত্র প্রদান করুন।');
      return;
    }
    setErrorMsg('');
    setShowPinModal(true);
  };

  const handleSubmitAddMoney = async () => {
    if (!securityPin) {
      setErrorMsg('আপনার সিকিউরিটি পিন প্রদান করুন।');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Map service back to original name for backend
    const serviceNameMap = {
      'বিকাশ': 'bKash',
      'নগদ': 'Nagad',
      'রকেট': 'Rocket',
      'ব্যাংক': 'Bank Deposit',
      'USDT': 'USDT'
    };
    const mappedService = serviceNameMap[selectedService];

    try {
      const receiptImg = await generateReceiptCanvas({
        type: 'Recharge', // Using receipt generation helper
        userName: user?.name || 'N/A',
        userPhone: user?.phone || 'N/A',
        serviceName: `${mappedService} Add Money`,
        amount: Number(amount),
        timestamp: new Date().toLocaleString('bn-BD'),
        targetNumber: senderPhone,
        trxId: trxId.trim()
      , showForeignCurrency, globalCurrencyName, globalCurrencyRate });

      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: mappedService === 'Bank Deposit' ? 'Bank Deposit' : 'Add Money',
          userPhone: user?.phone,
          serviceName: mappedService,
          paymentMethod: mappedService === 'Bank Deposit' ? 'Bank Transfer' : 'Personal',
          amount: Number(amount),
          account: senderPhone,
          trxId: trxId.trim(),
          pin: securityPin,
          receiptImage: receiptImg,
          recipientNumber: senderPhone,
          userName: user?.name,
          userRole: user?.role,
          operator: mappedService,
          packDetails: `${mappedService} MFS Add Money`
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'আবেদন সাবমিট করা যায়নি। পুনরায় চেষ্টা করুন।');
      }

      setStep(2);
      setShowPinModal(false);
      onOrderCreated(data.order);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pb-12 transition-all ${
      theme === 'dark' ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-neutral-800'
    }`}>
      {/* 1. Header with back arrow */}
      <div className={`p-4 flex items-center space-x-3 sticky top-0 z-30 border-b ${
        theme === 'dark' ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-neutral-150'
      }`}>
        <button
          onClick={onBack}
          className={`p-1 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer ${
            theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-neutral-100'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-base font-black tracking-tight font-serif-display">অ্যাড মানি</span>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        {step === 1 && (
          <div className="space-y-6">
            {/* 2. Solid Pink/Magenta Header Card */}
            <div className="bg-[#ec008c] rounded-2xl p-4 text-center shadow-md">
              <h2 className="text-white text-sm font-black tracking-wider">পেমেন্ট নাম্বার / ব্যাংক তথ্য</h2>
            </div>

            {/* 3. Small red centered instruction text */}
            <p className="text-center text-[11px] font-bold text-rose-600 animate-pulse">
              {selectedService === 'ব্যাংক' ? 'ব্যাংক তথ্যের উপর ক্লিক করলে হিসাব নম্বর কপি হবে' : 'নাম্বারের উপর ক্লিক করলে নাম্বার কপি হবে'}
            </p>

            {/* 4. Four Number display cards */}
            <div className="space-y-3">
              {/* bKash card */}
              <div
                onClick={() => handleCopy(adminNums.bkash, 'bkash')}
                className={`border rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] active:scale-98 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 hover:border-pink-500/50'
                    : 'bg-white border-neutral-200/80 shadow-2xs hover:border-pink-300'
                } ${selectedService === 'বিকাশ' ? 'border-[#ec008c] ring-1 ring-[#ec008c]/40' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-[#ec008c]">বিকাশঃ</span>
                  <span className={`text-sm font-black font-mono tracking-wider ${theme === 'dark' ? 'text-white' : 'text-neutral-800'}`}>
                    {adminNums.bkash}
                  </span>
                </div>
                {copiedType === 'bkash' ? (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>কপি হয়েছে</span>
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </div>

              {/* Nagad card */}
              <div
                onClick={() => handleCopy(adminNums.nagad, 'nagad')}
                className={`border rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] active:scale-98 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 hover:border-pink-500/50'
                    : 'bg-white border-neutral-200/80 shadow-2xs hover:border-pink-300'
                } ${selectedService === 'নগদ' ? 'border-[#ec008c] ring-1 ring-[#ec008c]/40' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-orange-500">নগদঃ</span>
                  <span className={`text-sm font-black font-mono tracking-wider ${theme === 'dark' ? 'text-white' : 'text-neutral-800'}`}>
                    {adminNums.nagad}
                  </span>
                </div>
                {copiedType === 'nagad' ? (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>কপি হয়েছে</span>
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </div>

              {/* Rocket card */}
              <div
                onClick={() => handleCopy(adminNums.rocket, 'rocket')}
                className={`border rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] active:scale-98 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 hover:border-pink-500/50'
                    : 'bg-white border-neutral-200/80 shadow-2xs hover:border-pink-300'
                } ${selectedService === 'রকেট' ? 'border-[#ec008c] ring-1 ring-[#ec008c]/40' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-purple-500">রকেটঃ</span>
                  <span className={`text-sm font-black font-mono tracking-wider ${theme === 'dark' ? 'text-white' : 'text-neutral-800'}`}>
                    {adminNums.rocket}
                  </span>
                </div>
                {copiedType === 'rocket' ? (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>কপি হয়েছে</span>
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </div>


              {/* USDT card */}
              <div
                onClick={() => handleCopy(adminNums.usdt, 'usdt')}
                className={`border rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] active:scale-98 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 hover:border-pink-500/50'
                    : 'bg-white border-neutral-200/80 shadow-2xs hover:border-pink-300'
                } ${selectedService === 'USDT' ? 'border-[#ec008c] ring-1 ring-[#ec008c]/40' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-emerald-600">USDT:</span>
                  <span className={`text-sm font-black font-mono tracking-wider ${theme === 'dark' ? 'text-white' : 'text-neutral-800'} truncate w-40`}>
                    {adminNums.usdt}
                  </span>
                </div>
                {copiedType === 'usdt' ? (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1 shrink-0">
                    <Check className="w-3 h-3" />
                    <span>কপি হয়েছে</span>
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                )}
              </div>
              
              {/* Bank card */}
              <div
                onClick={() => handleCopy('1234567890', 'bank')}
                className={`border rounded-2xl p-4 flex flex-col space-y-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-98 ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 hover:border-pink-500/50'
                    : 'bg-white border-neutral-200/80 shadow-2xs hover:border-pink-300'
                } ${selectedService === 'ব্যাংক' ? 'border-[#ec008c] ring-1 ring-[#ec008c]/40' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-blue-500">ব্যাংকঃ</span>
                      <span className={`text-xs font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-800'}`}>
                        Dutch-Bangla Bank PLC
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400">হিসাবের নামঃ Shakib Telecom</span>
                    <span className="text-[11px] text-neutral-400">রাউটিংঃ ০৯০২৬১৬৭৮</span>
                    <span className="text-[11px] text-neutral-400">শাখাঃ বনানী শাখা, ঢাকা</span>
                    <span className={`text-sm font-black font-mono tracking-wider ${theme === 'dark' ? 'text-white' : 'text-neutral-800'}`}>
                      হিসাব নংঃ 1234567890
                    </span>
                  </div>
                  {copiedType === 'bank' ? (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>কপি হয়েছে</span>
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                </div>
              </div>
            </div>

            {/* 5. Custom dropdown selector */}
            <div className="relative">
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`border rounded-2xl p-4 flex justify-between items-center cursor-pointer shadow-3xs transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-white'
                    : 'bg-white border-neutral-200/80 text-neutral-800'
                }`}
              >
                <span className="text-xs font-bold">{selectedService}</span>
                <ChevronDown className="w-4 h-4 text-blue-500" />
              </div>

              {isDropdownOpen && (
                <div className={`absolute left-0 right-0 z-40 border rounded-2xl shadow-lg mt-2 overflow-hidden transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 text-white'
                    : 'bg-white border-neutral-200/80 text-neutral-800'
                }`}>
                  {['বিকাশ', 'নগদ', 'রকেট', 'ব্যাংক', 'USDT'].map((opt) => (
                    <div
                      key={opt}
                      onClick={() => {
                        setSelectedService(opt as any);
                        setIsDropdownOpen(false);
                      }}
                      className={`p-4 text-xs font-bold cursor-pointer border-b last:border-b-0 transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-slate-800 border-slate-800' 
                          : 'hover:bg-neutral-50 border-neutral-100'
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Main Form Fields */}
            <form onSubmit={handleOpenPinModal} className="space-y-4">
              {/* Amount input */}
              <div className="space-y-1.5">
                <input
                  type="number"
                  required
                  placeholder="টাকার পরিমাণ"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full text-xs font-bold p-4 border rounded-2xl focus:outline-none focus:border-blue-500 transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600'
                      : 'bg-white border-neutral-200/85 text-neutral-800 placeholder-neutral-400 shadow-3xs'
                  }`}
                />
              </div>

              {/* Sender Number input */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  placeholder={selectedService === 'ব্যাংক' ? 'যে ব্যাংক অ্যাকাউন্ট থেকে টাকা পাঠিয়েছেন' : 'যে মোবাইল নাম্বার থেকে টাকা পাঠিয়েছেন'}
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className={`w-full text-xs font-bold p-4 border rounded-2xl focus:outline-none focus:border-blue-500 transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600'
                      : 'bg-white border-neutral-200/85 text-neutral-800 placeholder-neutral-400 shadow-3xs'
                  }`}
                />
              </div>

              {/* Transaction ID input */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  placeholder={selectedService === 'ব্যাংক' ? 'রেফারেন্স আইডি / ব্যাংক ট্রানজেকশন আইডি' : 'ট্রানজেকশন আইডি (TrxID)'}
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className={`w-full text-xs font-bold p-4 border rounded-2xl focus:outline-none focus:border-blue-500 transition-all ${
                    theme === 'dark'
                      ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600'
                      : 'bg-white border-neutral-200/85 text-neutral-800 placeholder-neutral-400 shadow-3xs'
                  }`}
                />
              </div>

              {errorMsg && (
                <p className="text-[11px] font-bold text-rose-600 text-center p-1">{errorMsg}</p>
              )}

              {/* 7. Pink/Magenta Request Button */}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl text-xs font-black text-white bg-[#ec008c] hover:bg-[#d6007e] shadow-md shadow-[#ec008c]/15 transition-all active:scale-98 cursor-pointer text-center"
              >
                রিকুয়েস্ট করুন
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className={`text-center py-12 px-6 rounded-3xl border space-y-6 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-neutral-200/60 shadow-md'
          }`}>
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                অ্যাড মানি রিকোয়েস্ট সফল হয়েছে!
              </h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                আপনার <b>৳{amount} BDT</b> অ্যাড মানি আবেদনটি সফলভাবে সিস্টেমে জমা হয়েছে। অ্যাডমিন প্যানেল থেকে ৫-১০ মিনিটের মধ্যে ভেরিফাই করে ব্যালেন্স যোগ করে দেয়া হবে।
              </p>
            </div>

            <button
              onClick={onBack}
              className="w-full py-3 rounded-2xl text-xs font-black text-white bg-neutral-950 hover:bg-neutral-900 transition-all cursor-pointer shadow-md"
            >
              ড্যাশবোর্ডে ফিরে যান
            </button>
          </div>
        )}
      </div>

      {/* Security PIN verification modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-xs rounded-3xl p-6 space-y-4 shadow-2xl border ${
            theme === 'dark' ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-neutral-200 text-neutral-800'
          }`}>
            <div className="text-center space-y-1">
              <ShieldCheck className="w-10 h-10 text-[#ec008c] mx-auto animate-bounce" />
              <h4 className="text-sm font-black">ওয়ালেট পিন নম্বর</h4>
              <p className="text-[10px] text-neutral-400">লেনদেন নিশ্চিত করতে আপনার পিন নম্বর দিন</p>
            </div>

            <input
              type="password"
              required
              maxLength={6}
              placeholder="••••"
              value={securityPin}
              onChange={(e) => setSecurityPin(e.target.value)}
              className={`w-full text-center p-3 text-lg font-bold border rounded-2xl focus:outline-none focus:border-[#ec008c] tracking-widest ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-neutral-250 text-neutral-900'
              }`}
            />

            {errorMsg && (
              <p className="text-[10px] font-bold text-rose-600 text-center">{errorMsg}</p>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setSecurityPin('');
                  setErrorMsg('');
                }}
                className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition-colors ${
                  theme === 'dark' ? 'border-slate-800 hover:bg-slate-800' : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleSubmitAddMoney}
                disabled={loading}
                className="flex-1 py-3 text-xs font-black text-white bg-[#ec008c] hover:bg-[#d6007e] rounded-2xl transition-all shadow-md shadow-[#ec008c]/20"
              >
                {loading ? 'প্রক্রিয়াধীন...' : 'নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
