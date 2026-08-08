import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ShoppingCart, Check, X, ShieldAlert, Sparkles, Globe } from 'lucide-react';
import { Offer, User } from '../types';
import { generateReceiptCanvas } from '../utils/receiptGenerator';

interface OfferListProps {
  showForeignCurrency?: boolean;
  globalCurrencyName?: string;
  globalCurrencyRate?: number;
  offers: Offer[];
  user: User;
  onOrderCreated: (createdOrder?: any) => void;
  theme?: 'light' | 'dark';
  initialMode?: 'drive' | 'internet';
}

export default function OfferList({ offers, user, onOrderCreated, theme = 'light', initialMode = 'drive' , showForeignCurrency, globalCurrencyName, globalCurrencyRate}: OfferListProps) {
  const [currentMode, setCurrentMode] = useState<'drive' | 'internet'>(initialMode);
  const [activeOperator, setActiveOperator] = useState<string>('All');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');

  // Purchase Modal State
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [targetPhone, setTargetPhone] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  // Synchronize internal currentMode state with prop
  useEffect(() => {
    if (initialMode) {
      setCurrentMode(initialMode);
    }
  }, [initialMode]);

  // List of Operators & Categories
  const operators = ['All', 'Grameenphone', 'Robi', 'Airtel', 'Banglalink'];
  const categories = ['All', 'Minutes', 'Internet', 'Bundles', 'Call Rate'];

  // Operator Style Helpers
  const opColors: Record<string, { bg: string, text: string, border: string }> = {
    Grameenphone: { bg: 'bg-[#E3F2FD]', text: 'text-[#0066CC]', border: 'border-[#BBDEFB]' },
    Robi: { bg: 'bg-[#FFEBEE]', text: 'text-[#D32F2F]', border: 'border-[#FFCDD2]' },
    Airtel: { bg: 'bg-[#F3E5F5]', text: 'text-[#8E24AA]', border: 'border-[#E1BEE7]' },
    Teletalk: { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', border: 'border-[#C8E6C9]' },
    Banglalink: { bg: 'bg-[#FFF3E0]', text: 'text-[#EF6C00]', border: 'border-[#FFE0B2]' }
  };

  const opShortNames: Record<string, string> = {
    Grameenphone: 'GP',
    Robi: 'Robi',
    Airtel: 'Airtel',
    Teletalk: 'TT',
    Banglalink: 'BL'
  };

  // 1. Initial Filtering based on Mode (Internet vs Drive Pack)
  let filtered = offers.filter(offer => offer.isEnabled);

  if (currentMode === 'internet') {
    // Show internet packages that are NOT marked as Drive Pack
    filtered = filtered.filter(o => o.category === 'Internet' && (o.isDrivePack === false || o.isDrivePack === undefined));
  } else {
    // Show packages that are marked as Drive Pack (or default to true if undefined for non-Internet)
    filtered = filtered.filter(o => o.isDrivePack === true || (o.category !== 'Internet' && o.isDrivePack === undefined));
  }

  // 2. Filter by Operator
  if (activeOperator !== 'All') {
    filtered = filtered.filter(o => o.operator === activeOperator);
  }

  // 3. Filter by Category (Only relevant in Drive Mode)
  if (currentMode === 'drive' && activeCategory !== 'All') {
    filtered = filtered.filter(o => o.category === activeCategory);
  }

  // 4. Search Filter
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(o => 
      o.title.toLowerCase().includes(q) || 
      o.operator.toLowerCase().includes(q) ||
      (o.description && o.description.toLowerCase().includes(q))
    );
  }

  // 5. Apply price markup dynamically for Internet packs (+100 BDT)
  const displayedOffers = filtered.map(o => {
    if (currentMode === 'internet') {
      return {
        ...o,
        resellerPrice: o.resellerPrice + 100,
        regularPrice: o.regularPrice + 100
      };
    }
    return o;
  });

  // 6. Sorting (Applies after price calculations)
  const sortedOffers = [...displayedOffers];
  if (sortBy === 'price-low') {
    sortedOffers.sort((a, b) => a.resellerPrice - b.resellerPrice);
  } else if (sortBy === 'price-high') {
    sortedOffers.sort((a, b) => b.resellerPrice - a.resellerPrice);
  } else if (sortBy === 'discount') {
    sortedOffers.sort((a, b) => (b.regularPrice - b.resellerPrice) - (a.regularPrice - a.resellerPrice));
  }

  const handleOpenPurchase = (offer: Offer) => {
    setSelectedOffer(offer);
    setTargetPhone('');
    setConfirmPin('');
    setErrorMsg('');
    setSuccessMsg(false);
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer) return;

    if (!targetPhone || targetPhone.length < 11) {
      setErrorMsg('সঠিক ১১-ডিজিটের গ্রাহক মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!confirmPin) {
      setErrorMsg('আপনার সিকিউরিটি পিন নম্বর প্রদান করুন।');
      return;
    }
    if (user.walletBalance < selectedOffer.resellerPrice) {
      setErrorMsg('আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই। অনুগ্রহ করে ফান্ড রিচার্জ করুন।');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const receiptImg = await generateReceiptCanvas({
        type: currentMode === 'internet' ? 'Internet' : 'Drive Pack',
        userName: user?.name || 'N/A',
        userPhone: user?.phone || 'N/A',
        serviceName: selectedOffer.title,
        amount: selectedOffer.resellerPrice,
        timestamp: new Date().toLocaleString('bn-BD'),
        targetNumber: targetPhone
      , showForeignCurrency, globalCurrencyName, globalCurrencyRate });

      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: currentMode === 'internet' ? 'Internet' : 'Drive Pack',
          userPhone: user?.phone, // paying user phone
          serviceName: selectedOffer.title,
          paymentMethod: currentMode === 'internet' ? 'Internet' : 'Drive Pack',
          amount: selectedOffer.resellerPrice,
          pin: confirmPin,
          receiptImage: receiptImg,
          recipientNumber: targetPhone,
          operator: selectedOffer.operator,
          packDetails: selectedOffer.title,
          userName: user?.name,
          userRole: user?.role
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'অফার ক্রয় সফল হয়নি। সঠিক পিন দিয়ে পুনরায় চেষ্টা করুন।');
      }

      setSuccessMsg(true);
      onOrderCreated(data.order);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Segmented Mode Selector Toggle */}
      <div className={`p-1 rounded-xl flex border max-w-md mx-auto ${
        theme === 'dark' ? 'bg-slate-950/80 border-slate-850/80' : 'bg-neutral-100 border-neutral-200'
      }`}>
        <button
          type="button"
          onClick={() => {
            setCurrentMode('drive');
            setActiveCategory('All');
          }}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
            currentMode === 'drive'
              ? theme === 'dark'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/15'
                : 'bg-indigo-600 text-white shadow-sm'
              : theme === 'dark'
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>ড্রাইভ প্যাক (Drive Pack)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setCurrentMode('internet');
            setActiveCategory('All');
          }}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
            currentMode === 'internet'
              ? theme === 'dark'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/15'
                : 'bg-indigo-600 text-white shadow-sm'
              : theme === 'dark'
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>ইন্টারনেট প্যাক (Internet Pack)</span>
        </button>
      </div>

      {/* Info Badge for Internet mode markup */}
      {currentMode === 'internet' && (
        <div className={`p-3 rounded-xl border text-[10px] font-black leading-snug flex items-center space-x-2 ${
          theme === 'dark' ? 'bg-cyan-950/20 border-cyan-900/40 text-cyan-400' : 'bg-indigo-50 border-indigo-150 text-indigo-750'
        }`}>
          <Sparkles className="w-4 h-4 shrink-0 text-cyan-500" />
          <span>ইন্টারনেট অফার মোড সক্রিয়! এই প্যাকগুলোতে অতিরিক্ত ৳১০০ রিটেইলার কমিশন ও গেটওয়ে চার্জ যুক্ত করা রয়েছে।</span>
        </div>
      )}

      {/* Search and Sort Toolbar */}
      <div className={`p-4 rounded-2xl border shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center ${
        theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-neutral-200/80'
      }`}>
        <div className="relative md:col-span-7">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            type="text"
            placeholder={
              currentMode === 'internet'
                ? "ইন্টারনেট অফার সার্চ করুন (উদাঃ 10GB, 30 Days ইত্যাদি)..."
                : "ড্রাইভ অফার সার্চ করুন (উদাঃ GP Super, 25GB, Robi ইত্যাদি)..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full text-xs p-3 pl-10 border rounded-xl focus:outline-none focus:border-cyan-500 transition-all font-medium ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-850 text-slate-100 placeholder-slate-600'
                : 'bg-neutral-50/50 border-neutral-250 text-neutral-800'
            }`}
          />
        </div>

        <div className="flex items-center space-x-2 md:col-span-5">
          <SlidersHorizontal className="text-neutral-400 w-4 h-4 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`w-full text-xs p-3 border rounded-xl focus:outline-none focus:border-cyan-500 transition-all font-medium appearance-none cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-850 text-slate-100'
                : 'bg-neutral-50/50 border-neutral-250 text-neutral-800'
            }`}
          >
            <option value="default">ডিফল্ট ক্রমানুসারে</option>
            <option value="price-low">মূল্য: কম থেকে বেশি</option>
            <option value="price-high">মূল্য: বেশি থেকে কম</option>
            <option value="discount">সর্বাধিক ডিসকাউন্ট অফার</option>
          </select>
        </div>
      </div>

      {/* Operator Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {operators.map((op) => {
          const isSel = activeOperator === op;
          return (
            <button
              key={op}
              onClick={() => setActiveOperator(op)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSel 
                  ? theme === 'dark'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/20 font-black'
                    : 'bg-neutral-950 text-white shadow-xs' 
                  : theme === 'dark'
                    ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-350'
              }`}
            >
              {op === 'All' ? 'সব অপারেটর' : op}
            </button>
          );
        })}
      </div>

      {/* Category Tabs (Only show in Drive Pack mode as Internet Pack only has Internet category) */}
      {currentMode === 'drive' && (
        <div className={`p-1.5 rounded-xl border flex flex-wrap gap-1 ${
          theme === 'dark' ? 'bg-slate-950/60 border-slate-850/80' : 'bg-neutral-50/80 border-neutral-200/50'
        }`}>
          {categories.filter(cat => cat !== 'Internet').map((cat) => {
            const isSel = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 min-w-[70px] py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  isSel 
                    ? theme === 'dark'
                      ? 'bg-slate-900 text-cyan-400 border border-slate-800/80 shadow-3xs'
                      : 'bg-white text-neutral-900 shadow-3xs' 
                    : theme === 'dark'
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {cat === 'All' ? 'সব ধরণের' : cat === 'Bundles' ? 'বান্ডেল' : cat === 'Minutes' ? 'মিনিট' : 'কলরেট'}
              </button>
            );
          })}
        </div>
      )}

      {/* Offers Grid */}
      {sortedOffers.length === 0 ? (
        <div className={`text-center py-12 rounded-2xl border p-6 ${
          theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-neutral-200/60'
        }`}>
          <p className="text-sm font-medium text-neutral-400">কোনো ম্যাচিং অফার খুঁজে পাওয়া যায়নি।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedOffers.map((offer) => {
            const colors = opColors[offer.operator] || { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-200' };
            const discount = offer.regularPrice - offer.resellerPrice;
            const discountPct = Math.round((discount / offer.regularPrice) * 100);

            return (
              <div 
                key={offer.id} 
                className={`rounded-2xl border p-5 transition-all shadow-3xs flex justify-between items-center space-x-4 ${
                  theme === 'dark'
                    ? 'bg-slate-900/40 border-slate-850 hover:border-slate-750'
                    : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                }`}
              >
                <div className="space-y-2 flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {opShortNames[offer.operator] || offer.operator}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      theme === 'dark' ? 'bg-slate-950 text-slate-400' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {offer.category}
                    </span>
                    {discount > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      }`}>
                        ডিসকাউন্ট: ৳{discount} ({discountPct}%)
                      </span>
                    )}
                  </div>

                  <h3 className={`text-sm font-black leading-tight ${theme === 'dark' ? 'text-slate-100' : 'text-neutral-900'}`}>
                    {offer.title}
                  </h3>

                  <p className={`text-xs font-medium line-clamp-1 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>
                    {offer.description || 'সরাসরি গিফট প্যাক, দ্রুত অ্যাক্টিভেশন।'}
                  </p>

                  <div className={`flex items-center space-x-4 pt-1 text-[11px] font-semibold ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-500'}`}>
                    <div>মেয়াদ: <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-neutral-800'} font-bold`}>{offer.validity}</span></div>
                    {offer.mb !== '0 GB' && <div>ডাটা: <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-neutral-800'} font-bold`}>{offer.mb}</span></div>}
                    {offer.min !== '0 Min' && <div>মিনিট: <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-neutral-800'} font-bold`}>{offer.min}</span></div>}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2 shrink-0 text-right">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-neutral-400 font-bold line-through">রেগুলার মূল্য ৳{offer.regularPrice}</p>
                    <p className={`text-base font-extrabold ${theme === 'dark' ? 'text-cyan-400' : 'text-neutral-900'}`}>৳{offer.resellerPrice}</p>
                  </div>

                  <button
                    onClick={() => handleOpenPurchase(offer)}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 font-bold text-[11px] rounded-lg shadow-sm transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black'
                        : 'bg-neutral-950 hover:bg-neutral-900 text-white'
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>কিনুন</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Purchase Checkout Drawer/Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/45 backdrop-blur-3xs">
          <div className={`rounded-2xl border p-6 max-w-md w-full shadow-xl space-y-5 ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-neutral-200 text-neutral-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${theme === 'dark' ? 'border-slate-850' : 'border-neutral-100'}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider">অফার চেকআউট (Offer Purchase)</h3>
              <button 
                onClick={() => setSelectedOffer(null)}
                className="text-neutral-400 hover:text-neutral-900 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!successMsg ? (
              <form onSubmit={handleConfirmPurchase} className="space-y-4">
                <div className={`border rounded-xl p-4 space-y-2 ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-850' : 'bg-neutral-50 border-neutral-200'
                }`}>
                  <p className="text-xs text-neutral-400 font-bold">প্যাকের বিবরণ:</p>
                  <p className={`text-sm font-extrabold leading-snug ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-800'}`}>{selectedOffer.title}</p>
                  <div className="flex items-center justify-between text-xs text-neutral-600 font-medium">
                    <span className="text-neutral-400 font-semibold">রেগুলার মূল্য: ৳{selectedOffer.regularPrice}</span>
                    <span className={`${theme === 'dark' ? 'text-slate-300' : 'text-neutral-600'} font-semibold`}>
                      সদস্য মূল্য: <b className={`${theme === 'dark' ? 'text-cyan-400' : 'text-neutral-900'} font-black`}>৳{selectedOffer.resellerPrice} BDT</b>
                    </span>
                  </div>
                </div>

                {/* Target Phone number */}
                <div className="flex flex-col space-y-1.5 text-left">
                  <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-700'}`}>গ্রাহকের মোবাইল নম্বর (Target Mobile Number) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., 017XXXXXXXX"
                    maxLength={11}
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value.replace(/\D/g, ''))}
                    className={`w-full text-xs p-3 border rounded-lg focus:outline-none focus:border-indigo-500 font-bold tracking-wide ${
                      theme === 'dark'
                        ? 'bg-slate-950 border-slate-850 text-slate-100'
                        : 'bg-white border-neutral-250 text-neutral-800'
                    }`}
                  />
                  <p className="text-[10px] text-neutral-400 font-medium">এই নম্বরে সরাসরি অফারটি সক্রিয় (Gift) হয়ে যাবে।</p>
                </div>

                {/* Security PIN */}
                <div className="flex flex-col space-y-1.5 text-left">
                  <label className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-700'}`}>সিকিউরিটি পিন নম্বর (Security PIN) *</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className={`w-full text-sm p-3 border rounded-lg focus:outline-none focus:border-indigo-500 text-center tracking-widest font-extrabold ${
                      theme === 'dark'
                        ? 'bg-slate-950 border-slate-850 text-slate-100'
                        : 'bg-white border-neutral-250 text-neutral-800'
                    }`}
                  />
                </div>

                {errorMsg && (
                  <div className="bg-red-50 text-red-700 p-2.5 rounded-lg text-xs font-semibold border border-red-150 flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedOffer(null)}
                    className={`flex-1 py-3 text-xs border font-bold rounded-lg transition-colors cursor-pointer ${
                      theme === 'dark'
                        ? 'border-slate-800 text-slate-400 hover:bg-slate-950/40'
                        : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    বাতিল করুন
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all shadow-xs flex items-center justify-center space-x-1 cursor-pointer ${
                      loading 
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' 
                        : theme === 'dark'
                          ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black'
                          : 'bg-neutral-950 hover:bg-neutral-900 text-white'
                    }`}
                  >
                    {loading ? (
                      <span>অর্ডার প্রসেস হচ্ছে...</span>
                    ) : (
                      <span>অর্ডার সাবমিট করুন (৳{selectedOffer.resellerPrice})</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className={`text-sm font-bold font-serif-display text-base ${theme === 'dark' ? 'text-slate-100' : 'text-neutral-900'}`}>অফার আবেদন সফল হয়েছে!</h4>
                  <p className={`text-xs leading-normal ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>
                    গ্রাহক নম্বর: <b className={theme === 'dark' ? 'text-slate-200' : 'text-neutral-800'}>{targetPhone}</b> এ <b className={theme === 'dark' ? 'text-slate-200' : 'text-neutral-800'}>{selectedOffer.title}</b> অফারের জন্য আবেদন এডমিন প্যানেলে পেন্ডিং করা হয়েছে। কিছুক্ষণের মধ্যে সক্রিয় হয়ে যাবে।
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOffer(null)}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black'
                      : 'bg-neutral-950 hover:bg-neutral-900 text-white'
                  }`}
                >
                  বন্ধ করুন
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
