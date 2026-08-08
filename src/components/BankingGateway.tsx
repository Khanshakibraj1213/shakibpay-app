import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Check, Building, FileText } from 'lucide-react';
import { Bank, User } from '../types';
import { generateReceiptCanvas } from '../utils/receiptGenerator';

interface BankingGatewayProps {
  showForeignCurrency?: boolean;
  globalCurrencyName?: string;
  globalCurrencyRate?: number;
  onBack: () => void;
  user: User;
  onOrderCreated: (createdOrder?: any) => void;
  theme?: 'light' | 'dark';
}

const MAJOR_BANKS: Bank[] = [
  { id: 'ibbl', name: 'Islami Bank Bangladesh PLC', logoColor: 'text-[#0E8A42]', bgColor: 'bg-emerald-50/50', accentColor: 'border-[#0E8A42]' },
  { id: 'dbbl', name: 'Dutch-Bangla Bank Ltd', logoColor: 'text-[#1E6738]', bgColor: 'bg-green-50/50', accentColor: 'border-[#1E6738]' },
  { id: 'city', name: 'The City Bank Ltd', logoColor: 'text-[#D01C24]', bgColor: 'bg-red-50/50', accentColor: 'border-[#D01C24]' },
  { id: 'brac', name: 'BRAC Bank PLC', logoColor: 'text-[#0051A2]', bgColor: 'bg-blue-50/50', accentColor: 'border-[#0051A2]' },
  { id: 'ebl', name: 'Eastern Bank PLC (EBL)', logoColor: 'text-[#1E4D82]', bgColor: 'bg-sky-50/50', accentColor: 'border-[#1E4D82]' },
  { id: 'pubali', name: 'Pubali Bank Ltd', logoColor: 'text-[#D9822B]', bgColor: 'bg-amber-50/50', accentColor: 'border-[#D9822B]' },
  { id: 'sonali', name: 'Sonali Bank PLC', logoColor: 'text-[#C93B2B]', bgColor: 'bg-orange-50/50', accentColor: 'border-[#C93B2B]' },
  { id: 'bankasia', name: 'Bank Asia Ltd', logoColor: 'text-[#2D338C]', bgColor: 'bg-indigo-50/50', accentColor: 'border-[#2D338C]' },
  { id: 'mtb', name: 'Mutual Trust Bank PLC', logoColor: 'text-[#6A1B29]', bgColor: 'bg-rose-50/50', accentColor: 'border-[#6A1B29]' },
  { id: 'trust', name: 'Trust Bank Ltd', logoColor: 'text-[#0D4F34]', bgColor: 'bg-teal-50/50', accentColor: 'border-[#0D4F34]' }
];

export default function BankingGateway({ onBack, user, onOrderCreated, theme = 'light' , showForeignCurrency, globalCurrencyName, globalCurrencyRate}: BankingGatewayProps) {
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [routingNumber, setRoutingNumber] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [ref, setRef] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank(bank);
    setStep(2);
  };

  const handleBankTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank) return;

    if (!accountHolder.trim()) {
      setErrorMsg('অ্যাকাউন্ট হোল্ডারের নাম প্রদান করুন।');
      return;
    }
    if (!accountNumber || accountNumber.length < 8) {
      setErrorMsg('সঠিক ব্যাঙ্ক অ্যাকাউন্ট নম্বর প্রদান করুন।');
      return;
    }
    if (!routingNumber || routingNumber.length < 9) {
      setErrorMsg('সঠিক ৯-ডিজিটের রাউটিং নম্বর প্রদান করুন।');
      return;
    }
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setErrorMsg('সঠিক স্থানান্তরের পরিমাণ প্রদান করুন।');
      return;
    }
    if (user.walletBalance < amt) {
      setErrorMsg('ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই।');
      return;
    }
    if (!pin) {
      setErrorMsg('সিকিউরিটি পিন প্রদান করুন।');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const receiptImg = await generateReceiptCanvas({
        type: 'Bank Transfer',
        userName: user?.name || 'N/A',
        userPhone: user?.phone || 'N/A',
        serviceName: selectedBank.name,
        amount: amt,
        timestamp: new Date().toLocaleString('bn-BD'),
        account: accountNumber
      , showForeignCurrency, globalCurrencyName, globalCurrencyRate });

      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Bank Transfer',
          userPhone: user.phone,
          serviceName: selectedBank.name,
          paymentMethod: 'Bank Transfer',
          amount: amt,
          account: accountNumber,
          routingNumber: routingNumber,
          accountHolder: accountHolder,
          ref: ref,
          pin: pin,
          receiptImage: receiptImg,
          recipientNumber: accountNumber,
          accountName: accountHolder,
          bankName: selectedBank.name,
          reference: ref,
          userName: user.name,
          userRole: user.role
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'ব্যাংক ফান্ড ট্রান্সফার রিকোয়েস্ট সাবমিট করা যায়নি। পুনরায় চেষ্টা করুন।');
      }

      setStep(3);
      onOrderCreated(data.order);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl border p-6 shadow-md max-w-3xl mx-auto w-full transition-all ${
      theme === 'dark'
        ? 'bg-slate-900/80 border-slate-800/80 text-slate-100'
        : 'bg-white border-neutral-200/80 text-neutral-800'
    }`}>
      {/* Back button */}
      {step !== 3 && (
        <button
          onClick={step === 2 ? () => { setStep(1); setErrorMsg(''); } : onBack}
          className={`flex items-center space-x-1.5 text-xs font-bold mb-6 transition-colors cursor-pointer ${
            theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 2 ? 'ব্যাংক তালিকা এ ফিরুন' : 'ড্যাশবোর্ডে ফিরুন'}</span>
        </button>
      )}

      {/* Progress Indicators */}
      <div className="flex items-center justify-between mb-8 px-4 max-w-xl mx-auto">
        {[
          { num: 1, label: 'ব্যাংক নির্বাচন' },
          { num: 2, label: 'ট্রান্সফার ফরম' },
          { num: 3, label: 'আবেদন সম্পন্ন' }
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s.num 
                ? theme === 'dark' ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-neutral-900 text-white shadow-xs' 
                : theme === 'dark'
                  ? 'bg-slate-950 text-slate-600 border border-slate-800'
                  : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
            }`}>
              {s.num}
            </div>
            <span className={`text-xs font-bold hidden sm:inline ${
              step >= s.num 
                ? theme === 'dark' ? 'text-cyan-400' : 'text-neutral-900' 
                : theme === 'dark' ? 'text-slate-600' : 'text-neutral-400'
            }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto space-y-1.5">
            <h2 className={`text-xl font-bold font-serif-display ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>বাংলাদেশ ব্যাংকিং গেটওয়ে (Bangladesh Banking)</h2>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>আপনার ওয়ালেটের টাকা সরাসরি বাংলাদেশের যেকোনো মূল ধারার ব্যাংকে ট্রান্সফার করুন।</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MAJOR_BANKS.map((bank) => (
              <button
                key={bank.id}
                onClick={() => handleSelectBank(bank)}
                className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900'
                    : `${bank.bgColor} border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/55`
                }`}
              >
                <div className={`p-2.5 rounded-lg shadow-xs ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
                  <Building className={`w-6 h-6 ${bank.logoColor}`} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold leading-tight ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'}`}>{bank.name}</p>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-500'}`}>Instant Routing</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && selectedBank && (
        <form onSubmit={handleBankTransferSubmit} className="space-y-5">
          <div className={`p-4 rounded-xl border-2 flex items-center space-x-3 ${
            theme === 'dark' 
              ? 'bg-slate-950 border-slate-800' 
              : `${selectedBank.bgColor} ${selectedBank.accentColor}`
          }`}>
            <Building className={`w-6 h-6 ${selectedBank.logoColor}`} />
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>নির্বাচিত ব্যাংক</p>
              <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{selectedBank.name}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Account Holder */}
            <div className="flex flex-col space-y-1.5">
              <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}`}>অ্যাকাউন্ট হোল্ডারের নাম (Account Holder Name)</label>
              <input
                type="text"
                required
                placeholder="e.g., Md. Shakib Raj"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className={`w-full text-xs p-3 border rounded-lg focus:outline-none focus:border-cyan-500 font-medium ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700'
                    : 'bg-white border-neutral-250 text-neutral-900'
                }`}
              />
            </div>

            {/* Account Number */}
            <div className="flex flex-col space-y-1.5">
              <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}`}>ব্যাংক অ্যাকাউন্ট নম্বর (Account Number)</label>
              <input
                type="text"
                required
                placeholder="e.g., 2050145020182470"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className={`w-full text-xs p-3 border rounded-lg focus:outline-none focus:border-cyan-500 font-mono ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700'
                    : 'bg-white border-neutral-250 text-neutral-900'
                }`}
              />
            </div>

            {/* Routing Number */}
            <div className="flex flex-col space-y-1.5">
              <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}`}>৯-ডিজিটের রাউটিং নম্বর (Routing Number)</label>
              <input
                type="text"
                required
                maxLength={9}
                placeholder="e.g., 125271382"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                className={`w-full text-xs p-3 border rounded-lg focus:outline-none focus:border-cyan-500 font-mono ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700'
                    : 'bg-white border-neutral-250 text-neutral-900'
                }`}
              />
            </div>

            {/* Transfer Amount */}
            <div className="flex flex-col space-y-1.5">
              <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}`}>স্থানান্তরের পরিমাণ (Amount BDT)</label>
              <input
                type="number"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full text-xs p-3 border rounded-lg focus:outline-none focus:border-cyan-500 font-bold ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700'
                    : 'bg-white border-neutral-250 text-neutral-900'
                }`}
              />
              <p className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>আপনার বর্তমান ওয়ালেট ব্যালেন্স: ৳{user.walletBalance} BDT</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Reference */}
            <div className="flex flex-col space-y-1.5">
              <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}`}>রেফারেন্স / নোট (Reference / Note)</label>
              <input
                type="text"
                placeholder="e.g., Family Support / Business payment"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                className={`w-full text-xs p-3 border rounded-lg focus:outline-none focus:border-cyan-500 ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700'
                    : 'bg-white border-neutral-250 text-neutral-900'
                }`}
              />
            </div>

            {/* Security PIN */}
            <div className="flex flex-col space-y-1.5">
              <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}`}>ওয়ালেট সিকিউরিটি পিন (PIN)</label>
              <input
                type="password"
                required
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className={`w-full text-sm p-3 border rounded-lg focus:outline-none focus:border-cyan-500 text-center tracking-widest font-bold ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-700'
                    : 'bg-white border-neutral-250 text-neutral-900'
                }`}
              />
            </div>
          </div>

          {errorMsg && (
            <p className={`text-xs font-semibold p-2.5 rounded-lg border ${
              theme === 'dark' ? 'bg-rose-950/40 text-rose-400 border-rose-900/40' : 'bg-red-50 text-red-600 border-red-150'
            }`}>{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              loading 
                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' 
                : theme === 'dark'
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-black shadow-lg shadow-cyan-950/20'
                  : 'bg-neutral-950 hover:bg-neutral-900 text-white shadow-md'
            }`}
          >
            {loading ? (
              <span>ব্যাংক ফান্ড ভেরিফিকেশন চলছে...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>ফান্ড ট্রান্সফার সাবমিট করুন</span>
              </>
            )}
          </button>
        </form>
      )}

      {step === 3 && selectedBank && (
        <div className="text-center py-10 space-y-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm border ${
            theme === 'dark' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            <Check className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className={`text-lg font-bold font-serif-display text-xl ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>ব্যাংক স্থানান্তর আবেদন সফল হয়েছে!</h3>
            <p className={`text-xs max-w-md mx-auto leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
              আপনার <b>{selectedBank.name}</b> ব্যাংক অ্যাকাউন্টে (A/C: {accountNumber}) <b>৳{amount} BDT</b> স্থানান্তরের জন্য আবেদন সাবমিট করা হয়েছে। এডমিন প্যানেলে এটি পেন্ডিং অবস্থায় রয়েছে এবং ভেরিফিকেশনের পর ১-২ ঘণ্টার মধ্যে অ্যাকাউন্ট এ টাকা জমা হবে।
            </p>
          </div>

          <button
            onClick={onBack}
            className={`px-6 py-2.5 rounded-lg text-xs font-bold shadow transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
                : 'bg-neutral-950 hover:bg-neutral-900 text-white'
            }`}
          >
            ড্যাশবোর্ডে ফিরে যান
          </button>
        </div>
      )}
    </div>
  );
}
