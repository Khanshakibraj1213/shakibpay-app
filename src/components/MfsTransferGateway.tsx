import React, { useState } from 'react';
import { ArrowLeft, Check, Copy, ShieldCheck, CreditCard, Coins, Smartphone, Globe, Landmark, HelpCircle } from 'lucide-react';
import { User } from '../types';
import { generateReceiptCanvas } from '../utils/receiptGenerator';

interface MfsTransferGatewayProps {
  showForeignCurrency?: boolean;
  globalCurrencyName?: string;
  globalCurrencyRate?: number;
  onBack: () => void;
  user: User;
  onOrderCreated: (createdOrder?: any) => void;
  theme?: 'light' | 'dark';
  initialProvider?: string | null;
}

interface MfsProviderConfig {
  name: string;
  slug: string;
  color: string;
  bgColorClass: string;
  borderColorClass: string;
  textColClass: string;
  icon: any;
}

const PROVIDERS: MfsProviderConfig[] = [
  { name: 'bKash', slug: 'bkash', color: '#ec008c', bgColorClass: 'bg-pink-50 dark:bg-pink-950/20', borderColorClass: 'border-pink-200 dark:border-pink-900/50', textColClass: 'text-pink-600 dark:text-pink-400', icon: CreditCard },
  { name: 'Nagad', slug: 'nagad', color: '#f36e21', bgColorClass: 'bg-orange-50 dark:bg-orange-950/20', borderColorClass: 'border-orange-200 dark:border-orange-900/50', textColClass: 'text-orange-600 dark:text-orange-400', icon: Coins },
  { name: 'Rocket', slug: 'rocket', color: '#8c3494', bgColorClass: 'bg-purple-50 dark:bg-purple-950/20', borderColorClass: 'border-purple-200 dark:border-purple-900/50', textColClass: 'text-purple-600 dark:text-purple-400', icon: Smartphone },
  { name: 'Upay', slug: 'upay', color: '#ffb900', bgColorClass: 'bg-yellow-50 dark:bg-yellow-950/20', borderColorClass: 'border-yellow-200 dark:border-yellow-900/50', textColClass: 'text-yellow-600 dark:text-yellow-400', icon: Globe },
  { name: 'Tap', slug: 'tap', color: '#00adef', bgColorClass: 'bg-cyan-50 dark:bg-cyan-950/20', borderColorClass: 'border-cyan-200 dark:border-cyan-900/50', textColClass: 'text-cyan-600 dark:text-cyan-400', icon: Landmark }
];

export default function MfsTransferGateway({ onBack, user, onOrderCreated, theme = 'light', initialProvider , showForeignCurrency, globalCurrencyName, globalCurrencyRate}: MfsTransferGatewayProps) {
  const [selectedProvider, setSelectedProvider] = useState<MfsProviderConfig | null>(() => {
    if (initialProvider) {
      const found = PROVIDERS.find(p => p.slug === initialProvider);
      return found || null;
    }
    return null;
  });

  // Flow State
  const [step, setStep] = useState<1 | 2>(1); // 1: Form, 2: Success
  const [transferType, setTransferType] = useState<'Personal' | 'Agent'>('Personal');
  const [recipientNumber, setRecipientNumber] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // See All Modal / List State
  const [isSeeAllOpen, setIsSeeAllOpen] = useState<boolean>(!initialProvider);

  // PIN modal State
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [securityPin, setSecurityPin] = useState<string>('');

  const quickAmountChips = [500, 1000, 2000, 5000];

  const handleChipClick = (val: number) => {
    const current = Number(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleProviderSelect = (prov: MfsProviderConfig) => {
    setSelectedProvider(prov);
    setIsSeeAllOpen(false);
    setErrorMsg('');
  };

  const handleOpenPinModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) {
      setErrorMsg('অনুগ্রহ করে একটি MFS অপারেটর নির্বাচন করুন।');
      return;
    }
    if (!recipientNumber || recipientNumber.length < 11) {
      setErrorMsg('১১ ডিজিটের সঠিক প্রাপকের MFS নম্বর প্রদান করুন।');
      return;
    }
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setErrorMsg('সঠিক স্থানান্তরের পরিমাণ প্রদান করুন।');
      return;
    }
    if (user.walletBalance < amt) {
      setErrorMsg('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!');
      return;
    }
    setErrorMsg('');
    setShowPinModal(true);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedProvider) return;
    if (!securityPin) {
      setErrorMsg('আপনার সিকিউরিটি পিন প্রদান করুন।');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const amt = Number(amount);
    const typeLabel = transferType === 'Personal' ? 'পার্সোনাল (Send Money)' : 'এজেন্ট (Cash Out)';
    const mfsName = selectedProvider.name;

    try {
      const timestampStr = new Date().toLocaleString('bn-BD');
      
      // Generate standard invoice receipt
      const receiptImg = await generateReceiptCanvas({
        type: 'MFS Transfer',
        userName: user?.name || 'N/A',
        userPhone: user?.phone || 'N/A',
        serviceName: `${mfsName} ${typeLabel}`,
        amount: amt,
        timestamp: timestampStr,
        targetNumber: recipientNumber,
        trxId: `PENDING`
      , showForeignCurrency, globalCurrencyName, globalCurrencyRate });

      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MFS Transfer',
          userPhone: user?.phone,
          serviceName: `${mfsName} ${typeLabel}`,
          paymentMethod: transferType,
          amount: amt,
          recipientNumber: recipientNumber,
          account: recipientNumber,
          reference: reference,
          ref: reference || 'MFS Transfer',
          pin: securityPin,
          receiptImage: receiptImg,
          operator: mfsName,
          packDetails: `MFS Transfer to ${recipientNumber} via ${mfsName} (${transferType})`,
          userName: user?.name,
          userRole: user?.role
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'আবেদন সাবমিট করা যায়নি। পুনরায় চেষ্টা করুন।');
      }

      setStep(2);
      setShowPinModal(false);
      onOrderCreated(data.order);
    } catch (err: any) {
      setErrorMsg(err.message || 'সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pb-16 transition-all ${
      theme === 'dark' ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-neutral-800'
    }`}>
      {/* Header */}
      <div className={`p-4 flex items-center justify-between sticky top-0 z-30 border-b ${
        theme === 'dark' ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-neutral-150'
      }`}>
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className={`p-1 rounded-full transition-colors cursor-pointer ${
              theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-neutral-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-black tracking-tight font-serif-display">
            {selectedProvider ? `${selectedProvider.name} ট্রান্সফার` : 'MFS ট্রান্সফার'}
          </span>
        </div>
        {!selectedProvider && (
          <button
            onClick={() => setIsSeeAllOpen(true)}
            className={`text-xs font-black px-3 py-1.5 rounded-xl border ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-cyan-400 hover:bg-slate-800'
                : 'bg-white border-neutral-200 text-indigo-600 hover:bg-neutral-50 shadow-4xs'
            }`}
          >
            See All Providers
          </button>
        )}
      </div>

      <div className="max-w-md mx-auto px-4 mt-6">
        {isSeeAllOpen ? (
          /* "See All" MFS Providers Selection Page/Modal style */
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border text-center ${
              theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80 shadow-md' : 'bg-white border-neutral-150 shadow-xs'
            }`}>
              <h2 className="text-sm font-black tracking-wide mb-1.5">MFS অপারেটর নির্বাচন করুন</h2>
              <p className="text-[10px] text-neutral-400">ট্রান্সফার শুরু করতে নিচের যেকোনো একটি গেটওয়ে পছন্দ করুন</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {PROVIDERS.map((prov) => {
                const Icon = prov.icon;
                return (
                  <button
                    key={prov.slug}
                    onClick={() => handleProviderSelect(prov)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] active:scale-98 cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/50'
                        : 'bg-white border-neutral-200/80 shadow-2xs hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${prov.bgColorClass} ${prov.textColClass} border ${prov.borderColorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black leading-tight">{prov.name} Transfer</h4>
                        <span className="text-[9.5px] text-neutral-400">Instant direct wallet transfer</span>
                      </div>
                    </div>
                    <div className={`text-[10px] font-black px-3 py-1 rounded-full ${prov.bgColorClass} ${prov.textColClass}`}>
                      Select
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Transfer Form View */
          <div>
            {step === 1 ? (
              <div className="space-y-6">
                {/* Operator Identity Badge */}
                {selectedProvider && (
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-neutral-150 shadow-xs'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selectedProvider.bgColorClass} ${selectedProvider.textColClass} border ${selectedProvider.borderColorClass}`}>
                        <selectedProvider.icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 leading-none block">অপারেটর</span>
                        <h3 className="text-xs font-black">{selectedProvider.name} Gateway</h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSeeAllOpen(true)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-lg border cursor-pointer ${
                        theme === 'dark' ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      পরিবর্তন করুন
                    </button>
                  </div>
                )}

                <form onSubmit={handleOpenPinModal} className="space-y-5 text-left">
                  {/* 1. Transfer Type Radio options */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    theme === 'dark' ? 'bg-slate-900/40 border-slate-800/60' : 'bg-white border-neutral-150 shadow-xs'
                  }`}>
                    <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block">ট্রান্সফার ধরণ (Transfer Type)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`p-3 rounded-xl border flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                        transferType === 'Personal' 
                          ? 'border-indigo-500 bg-indigo-50/10 text-indigo-500' 
                          : theme === 'dark' ? 'border-slate-800 bg-slate-950/20 text-slate-400' : 'border-neutral-200 bg-white text-neutral-600'
                      }`}>
                        <input
                          type="radio"
                          name="transferType"
                          value="Personal"
                          checked={transferType === 'Personal'}
                          onChange={() => setTransferType('Personal')}
                          className="hidden"
                        />
                        <span className="text-xs font-black">পার্সোনাল (Send Money)</span>
                      </label>

                      <label className={`p-3 rounded-xl border flex items-center justify-center space-x-2 cursor-pointer transition-all ${
                        transferType === 'Agent' 
                          ? 'border-indigo-500 bg-indigo-50/10 text-indigo-500' 
                          : theme === 'dark' ? 'border-slate-800 bg-slate-950/20 text-slate-400' : 'border-neutral-200 bg-white text-neutral-600'
                      }`}>
                        <input
                          type="radio"
                          name="transferType"
                          value="Agent"
                          checked={transferType === 'Agent'}
                          onChange={() => setTransferType('Agent')}
                          className="hidden"
                        />
                        <span className="text-xs font-black">এজেন্ট (Cash Out)</span>
                      </label>
                    </div>
                  </div>

                  {/* 2. Recipient Number Input */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400 ml-1">প্রাপকের MFS নম্বর</label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      placeholder="যেমনঃ 01XXXXXXXXX"
                      value={recipientNumber}
                      onChange={(e) => setRecipientNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      className={`w-full text-xs font-bold p-4 border rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600'
                          : 'bg-white border-neutral-200/85 text-neutral-800 placeholder-neutral-400 shadow-3xs'
                      }`}
                    />
                  </div>

                  {/* 3. Amount BDT Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400 ml-1">টাকার পরিমাণ (Amount BDT)</label>
                    <input
                      type="number"
                      required
                      placeholder="টাকার পরিমাণ লিখুন"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full text-xs font-bold p-4 border rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600'
                          : 'bg-white border-neutral-200/85 text-neutral-800 placeholder-neutral-400 shadow-3xs'
                      }`}
                    />
                    {/* Quick select chips */}
                    <div className="flex flex-wrap gap-2">
                      {quickAmountChips.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleChipClick(val)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all cursor-pointer active:scale-95 ${
                            theme === 'dark'
                              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                              : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-4xs'
                          }`}
                        >
                          +৳{val.toLocaleString('bn-BD')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Reference (Optional Input) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-neutral-400 ml-1">রেফারেন্স বা নোটিশ (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      placeholder="যেমনঃ পারিবারিক খরচ"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className={`w-full text-xs font-bold p-4 border rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600'
                          : 'bg-white border-neutral-200/85 text-neutral-800 placeholder-neutral-400 shadow-3xs'
                      }`}
                    />
                  </div>

                  {/* 5. Live Summary Box */}
                  <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                    theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80 text-slate-300' : 'bg-neutral-50/70 border-neutral-150 text-neutral-700'
                  }`}>
                    <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block">লেনদেনের সারসংক্ষেপ</span>
                    <div className="flex justify-between">
                      <span>পরিমাণঃ</span>
                      <span className="font-bold">৳{amount ? Number(amount).toLocaleString() : '০'} BDT</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 border-neutral-200 dark:border-slate-800">
                      <span>সার্ভিস চার্জঃ</span>
                      <span className="text-emerald-600 font-bold">৳০.০০ (ফ্রি)</span>
                    </div>
                    <div className="flex justify-between pt-0.5 text-sm font-black">
                      <span className={theme === 'dark' ? 'text-white' : 'text-neutral-900'}>মোট ওয়ালেট কর্তনঃ</span>
                      <span className={theme === 'dark' ? 'text-cyan-400' : 'text-indigo-600'}>
                        ৳{amount ? Number(amount).toLocaleString() : '০'} BDT
                      </span>
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-[11px] font-bold text-rose-600 text-center p-1 leading-snug">{errorMsg}</p>
                  )}

                  {/* Request Button */}
                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/15 transition-all active:scale-98 cursor-pointer text-center"
                  >
                    ট্রান্সফার রিকোয়েস্ট পাঠান
                  </button>
                </form>
              </div>
            ) : (
              /* Step 2: Success Confirmation Page */
              <div className={`text-center py-10 px-6 rounded-3xl border space-y-6 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-neutral-200/60 shadow-md'
              }`}>
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                    ট্রান্সফার আবেদন সম্পন্ন হয়েছে!
                  </h3>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    আপনার <b>{selectedProvider?.name}</b> ওয়ালেট থেকে <b>৳{Number(amount).toLocaleString()} BDT</b> স্থানান্তরের আবেদনটি পেন্ডিং অবস্থায় সিস্টেমে জমা হয়েছে। এডমিন ৫ মিনিটের মধ্যে যাচাই করে সম্পূর্ণ করবেন।
                  </p>
                </div>

                <div className={`p-3 rounded-xl text-[10px] font-mono border text-left space-y-1.5 ${
                  theme === 'dark' ? 'bg-slate-950/40 border-slate-800/80 text-slate-300' : 'bg-neutral-50 border-neutral-150 text-neutral-600'
                }`}>
                  <div><span className="font-bold">অপারেটরঃ</span> {selectedProvider?.name}</div>
                  <div><span className="font-bold">ধরণঃ</span> {transferType === 'Personal' ? 'পার্সোনাল' : 'এজেন্ট'}</div>
                  <div><span className="font-bold">প্রাপক নম্বরঃ</span> {recipientNumber}</div>
                  <div><span className="font-bold">টাকার পরিমাণঃ</span> ৳{Number(amount).toLocaleString()}</div>
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
        )}
      </div>

      {/* Security PIN verification modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-xs rounded-3xl p-6 space-y-4 shadow-2xl border animate-scale-up ${
            theme === 'dark' ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-neutral-200 text-neutral-800'
          }`}>
            <div className="text-center space-y-1">
              <ShieldCheck className="w-10 h-10 text-indigo-500 mx-auto animate-bounce" />
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
              className={`w-full text-center p-3 text-lg font-bold border rounded-2xl focus:outline-none focus:border-indigo-500 tracking-widest ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-neutral-250 text-neutral-900'
              }`}
            />

            {errorMsg && (
              <p className="text-[10px] font-bold text-rose-600 text-center leading-snug">{errorMsg}</p>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setSecurityPin('');
                  setErrorMsg('');
                }}
                className={`flex-1 py-3 text-xs font-bold rounded-2xl border transition-colors cursor-pointer ${
                  theme === 'dark' ? 'border-slate-800 hover:bg-slate-800' : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleConfirmTransfer}
                disabled={loading}
                className="flex-1 py-3 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
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
