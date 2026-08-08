import React, { useState } from 'react';
import { 
  ChevronLeft, 
  PhoneCall, 
  Check, 
  X, 
  ShieldAlert, 
  Globe, 
  Tag, 
  Flame, 
  Coins, 
  Smartphone, 
  AlertCircle,
  Clock,
  TrendingUp,
  Award,
  Phone,
  ChevronRight
} from 'lucide-react';
import { User } from '../types';

interface CallingCardViewProps {
  user: User;
  onBack: () => void;
  onOrderCreated: (createdOrder?: any) => void;
  theme?: 'light' | 'dark';
  orders?: any[];
  onViewActiveCard?: (card: any) => void;


  showForeignCurrency?: boolean;
  globalCurrencyName?: string;
  globalCurrencyRate?: number;
}

interface CardOffer {
  id: string;
  brand: string;
  pulseRate: string;
  country: string;
  value: number; // USD value (e.g. 10, 15, 25)
  priceBdt: number;
  minutes: string;
  rateDescription: string;
}

// 1. Initial Calling Card Packages Seed Data
const callingCardOffers: CardOffer[] = [
  // Itel Mobile Dialer offers
  { id: 'cc-1', brand: 'Itel Mobile Dialer', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 10, priceBdt: 1120, minutes: '১২০০ মিনিট', rateDescription: '৩০ সেকেন্ড পালস রেট, ক্রিস্টাল ক্লিয়ার অডিও' },
  { id: 'cc-2', brand: 'Itel Mobile Dialer', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 15, priceBdt: 1680, minutes: '১৮০০ মিনিট', rateDescription: '৩০ সেকেন্ড পালস রেট, ক্রিস্টাল ক্লিয়ার অডিও' },
  { id: 'cc-3', brand: 'Itel Mobile Dialer', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 25, priceBdt: 2800, minutes: '৩০০০ মিনিট', rateDescription: '৩০ সেকেন্ড পালস রেট, ক্রিস্টাল ক্লিয়ার অডিও' },
  { id: 'cc-4', brand: 'Itel Mobile Dialer', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'India', value: 10, priceBdt: 1150, minutes: '১৩০০ মিনিট', rateDescription: 'নন-ক্লিপিং প্রিমিয়াম লাইন' },
  { id: 'cc-5', brand: 'Itel Mobile Dialer', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'India', value: 25, priceBdt: 2850, minutes: '৩২৫০ মিনিট', rateDescription: 'নন-ক্লিপিং প্রিমিয়াম লাইন' },
  { id: 'cc-6', brand: 'Itel Mobile Dialer', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 10, priceBdt: 1090, minutes: '১০০০ মিনিট', rateDescription: '৫০ সেকেন্ড পালস স্ট্যান্ডার্ড ভয়েস' },
  { id: 'cc-7', brand: 'Itel Mobile Dialer', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 25, priceBdt: 2700, minutes: '২৫০০ মিনিট', rateDescription: '৫০ সেকেন্ড পালস স্ট্যান্ডার্ড ভয়েস' },
  
  // Green Tel Dollar offers
  { id: 'cc-8', brand: 'Green Tel Dollar', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 10, priceBdt: 1100, minutes: '১০০০ মিনিট', rateDescription: '৫০ সেকেন্ড পালস, ১ নম্বর কোয়ালিটি রাউটিং' },
  { id: 'cc-9', brand: 'Green Tel Dollar', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 15, priceBdt: 1650, minutes: '১৫০০ মিনিট', rateDescription: '৫০ সেকেন্ড পালস, ১ নম্বর কোয়ালিটি রাউটিং' },
  { id: 'cc-10', brand: 'Green Tel Dollar', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Bangladesh', value: 25, priceBdt: 2750, minutes: '২৫০০ মিনিট', rateDescription: '৫০ সেকেন্ড পালস, ১ নম্বর কোয়ালিটি রাউটিং' },
  { id: 'cc-11', brand: 'Green Tel Dollar', pulseRate: '৫০ সেকেন্ডে ১ মিনিট হবে', country: 'Saudi Arabia', value: 15, priceBdt: 1700, minutes: '১২০০ মিনিট', rateDescription: 'লো-পিং সৌদি আরব ইন্টারন্যাশনাল রাউট' },
  { id: 'cc-12', brand: 'Green Tel Dollar', pulseRate: '৩০ সেকেন্ডে ১ মিনিট হবে', country: 'Pakistan', value: 10, priceBdt: 1140, minutes: '১১০০ মিনিট', rateDescription: 'পাকিস্তান হাই কোয়ালিটি ভয়েস লাইন' },
  
  // Jamalpur Express Dollar offers
  { id: 'cc-13', brand: 'Jamalpur Express Dollar', pulseRate: 'ইউএসডি ১/১ মিনিট হবে', country: 'Bangladesh', value: 10, priceBdt: 1140, minutes: '৮০০ মিনিট', rateDescription: '১/১ পালস সুপার স্ট্রং ব্যান্ডউইথ লাইন' },
  { id: 'cc-14', brand: 'Jamalpur Express Dollar', pulseRate: 'ইউএসডি ১/১ মিনিট হবে', country: 'Bangladesh', value: 25, priceBdt: 2820, minutes: '২০০০ মিনিট', rateDescription: '১/১ পালস সুপার স্ট্রং ব্যান্ডউইথ লাইন' },
  { id: 'cc-15', brand: 'Jamalpur Express Dollar', pulseRate: 'ইউএসডি ১/১ মিনিট হবে', country: 'UAE', value: 15, priceBdt: 1750, minutes: '৬০০ মিনিট', rateDescription: 'দুবাই/শারজাহ ডায়ালার ভিআইপি লাইন' },
  { id: 'cc-16', brand: 'Jamalpur Express Dollar', pulseRate: 'ইউএসডি ১/১ মিনিট হবে', country: 'Qatar', value: 25, priceBdt: 2900, minutes: '১১০০ মিনিট', rateDescription: 'কাতার ও দোহা স্পেশাল নেটওয়ার্ক' }
];

const BRANDS = [
  { id: 'rm', name: 'Itel Mobile Dialer', subText: 'itel mobile dialer', colorClass: 'from-blue-600 to-sky-700', rating: '4.9', activeUsers: '1.2K+' },
  { id: 'green', name: 'Green Tel Dollar', subText: 'itel mobile dialer', colorClass: 'from-emerald-600 to-teal-700', rating: '4.8', activeUsers: '980+' },
  { id: 'jamalpur', name: 'Jamalpur Express Dollar', subText: 'itel mobile dialer', colorClass: 'from-indigo-600 to-violet-700', rating: '4.9', activeUsers: '1.5K+' }
];

const PULSE_RATES = [
  '৩০ সেকেন্ডে ১ মিনিট হবে',
  '৫০ সেকেন্ডে ১ মিনিট হবে',
  'ইউএসডি ১/১ মিনিট হবে'
];

const COUNTRIES = [
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', label: 'বাংলাদেশ' },
  { code: 'IN', name: 'India', flag: '🇮🇳', label: 'ভারত' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', label: 'পাকিস্তান' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', label: 'সৌদি আরব' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', label: 'ইউএই' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', label: 'কাতার' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', label: 'ওমান' }
];

const DOLLAR_VALUES = [
  { label: 'সব মূল্য', value: 0 },
  { label: '$10', value: 10 },
  { label: '$15', value: 15 },
  { label: '$25', value: 25 },
  { label: '$50', value: 50 }
];

export default function CallingCardView({ 
  user, 
  onBack, 
  onOrderCreated, 
  theme = 'light',
  orders = [],
  onViewActiveCard = () => {},
  globalCurrencyName = 'USD',
  globalCurrencyRate = 120,
  showForeignCurrency = false
}: CallingCardViewProps) {
  // Navigation Screens: 'brands' | 'pulses' | 'offers'
  const [screen, setScreen] = useState<'brands' | 'offers'>('brands');
  
  // Selected values
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  
  
  // Dynamic cards state
  const [cardsList, setCardsList] = useState<CardOffer[]>(callingCardOffers);

  React.useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || '') + '/api/calling-cards')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCardsList(data);
        }
      })
      .catch(err => console.error("Error loading dynamic calling card list:", err));
  }, []);

  // Filters
  const [selectedCountry, setSelectedCountry] = useState<string>('Bangladesh');
  const [selectedDollarVal, setSelectedDollarVal] = useState<number>(0); // 0 means all

  // Purchase Bottom Sheet Modal State
  const [buyingOffer, setBuyingOffer] = useState<CardOffer | null>(null);
  const [recipientNumber, setRecipientNumber] = useState<string>(user?.phone || '');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Filtering offers based on current user selections
  const filteredOffers = cardsList.filter(o => {
    return o.brand === selectedBrand && 
           o.country === selectedCountry && 
           (selectedDollarVal === 0 || o.value === selectedDollarVal);
  });

  const handleBrandSelect = (brandName: string) => {
    setSelectedBrand(brandName);
    setScreen('offers');
  };

  const handleOpenBuyModal = (offer: CardOffer) => {
    setBuyingOffer(offer);
    setConfirmPin('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyingOffer) return;
    
    if (!recipientNumber || recipientNumber.length < 11) {
      setErrorMsg('১১ ডিজিটের সঠিক মোবাইল বা অ্যাকাউন্ট নম্বর দিন!');
      return;
    }
    if (!confirmPin) {
      setErrorMsg('সিকিউরিটি পিন নম্বর প্রদান করুন!');
      return;
    }

    if (user.walletBalance < buyingOffer.priceBdt) {
      setErrorMsg('দুঃখিত, আপনার ওয়ালেটে পর্যাপ্ত ব্যালেন্স নেই!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch((import.meta.env.VITE_API_URL || '') + '/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Calling Card',
          packageId: buyingOffer.id,
          userPhone: user.phone,
          serviceName: buyingOffer.brand,
          paymentMethod: 'Wallet',
          amount: buyingOffer.priceBdt,
          recipientNumber: recipientNumber,
          account: recipientNumber,
          pin: confirmPin,
          operator: buyingOffer.pulseRate,
          packDetails: `${buyingOffer.brand} $${buyingOffer.value} (${buyingOffer.country}) - ${buyingOffer.minutes}`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'অর্ডারটি সম্পন্ন করা যায়নি।');
      }

      setSuccessMsg(`৳${buyingOffer.priceBdt} BDT সফলভাবে কেটে নেওয়া হয়েছে! আপনার কলিং কার্ড পিন ও অ্যাকাউন্ট ডিটেইলস কিছুক্ষণের মধ্যে সক্রিয় করা হবে।`);
      onOrderCreated(); // Trigger parent reload of state
    } catch (err: any) {
      setErrorMsg(err.message || 'নেটওয়ার্ক এরর, আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button & Title header */}
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => {
            if (screen === 'offers') setScreen('brands');
            else onBack();
          }}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            theme === 'dark' 
              ? 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white' 
              : 'border-neutral-100 bg-white text-neutral-600 hover:bg-neutral-50 shadow-4xs'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
            {screen === 'brands' && 'কলিং কার্ড ব্র্যান্ডসমূহ (Calling Cards)'}
            {screen === 'offers' && `${selectedBrand} Offers`}
          </h2>
          <p className={`text-[9px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>
            {screen === 'brands' && 'আইটেল মোবাইল ডায়ালারের জন্য অটো পিন ও ডলার রিচার্জ'}
            {screen === 'offers' && 'দেশ ও কার্ডের ডলারের মান অনুযায়ী অফার সিলেক্ট করুন'}
          </p>
        </div>
      </div>

      {/* Top System Notice Banner (displayed on Brands screen as requested) */}
      {screen === 'brands' && (
        <div className={`p-3 rounded-2xl border flex items-start space-x-2.5 overflow-hidden relative shadow-4xs animate-pulse-subtle ${
          theme === 'dark' 
            ? 'bg-amber-950/25 border-amber-800/40 text-amber-300' 
            : 'bg-amber-50 border-amber-100 text-amber-900'
        }`}>
          <Flame className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[10px] leading-relaxed text-left">
            <span className="font-black uppercase tracking-wider block mb-0.5">📢 SYSTEM UPDATE / কলিং কার্ড নোটিশ</span>
            <marquee scrollamount="3" className="font-bold">
              Itel Mobile Dialer, Green Tel Dollar এবং Jamalpur Express Dollar ২৪ ঘন্টা অটোমেটিক রিচার্জ ও পিন জেনারেট সার্ভিস চালু রয়েছে। ভুল পিন সাবমিট করবেন না।
            </marquee>
          </div>
        </div>
      )}

      {/* 1. BRANDS SCREEN */}
      {screen === 'brands' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {BRANDS.map((brand) => (
            <button
              key={brand.id}
              onClick={() => handleBrandSelect(brand.name)}
              className={`p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden group cursor-pointer hover:shadow-md hover:scale-[1.01] ${
                theme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800/85 hover:border-indigo-500/80'
                  : 'bg-white border-neutral-150 hover:border-indigo-500 shadow-sm'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${brand.colorClass} flex items-center justify-center text-white mb-4 shadow-sm`}>
                <PhoneCall className="w-5 h-5" />
              </div>
              
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100/40">
                  {brand.subText}
                </span>
                <h3 className={`text-sm font-black mt-2 leading-tight ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                  {brand.name}
                </h3>
                <p className={`text-[10px] mt-1 font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>
                  সুপার ক্লিয়ার ভয়েস কোয়ালিটি এবং নন-ড্রপ ব্যালেন্স।
                </p>
              </div>

              {/* Extra visual metadata */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 dark:border-slate-800/60 text-[9px] font-bold text-neutral-500 dark:text-slate-400">
                <span className="flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Rating: {brand.rating}</span>
                </span>
                <span>Active: {brand.activeUsers}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Section: Active Calling Cards relocated inside CallingCardView */}
      {screen === 'brands' && (() => {
        const activeCards = (orders || []).filter(
          o => o.userPhone === user.phone && 
               o.type === 'Calling Card' && 
               o.status?.toUpperCase() === 'SUCCESS'
        );
        if (activeCards.length === 0) return null;
        
        return (
          <div className={`rounded-2xl border p-4 shadow-xl space-y-3 relative overflow-hidden text-left mt-6 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-indigo-950 to-neutral-900 border-indigo-500/20 text-white'
              : 'bg-gradient-to-r from-indigo-50/70 to-indigo-100/30 border-indigo-200/60 text-neutral-800'
          }`}>
            <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
            
            <div className={`flex items-center justify-between border-b pb-2 relative z-10 ${
              theme === 'dark' ? 'border-indigo-500/20' : 'border-indigo-200/40'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100/80 text-indigo-750'}`}>
                  <Phone className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className={`text-xs font-black tracking-wide ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-900'}`}>আপনার সক্রিয় কলিং কার্ড</h4>
                  <p className={`text-[9px] font-bold ${theme === 'dark' ? 'text-indigo-300/80' : 'text-indigo-600/70'}`}>Your Active Calling Cards</p>
                </div>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                theme === 'dark' 
                  ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/20' 
                  : 'bg-indigo-100 text-indigo-750 border-indigo-200/50'
              }`}>
                {activeCards.length} Active
              </span>
            </div>
            
            <div className="space-y-2 relative z-10">
              {activeCards.map((card) => (
                <div 
                  key={card.id}
                  className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                    theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10 border-white/10'
                      : 'bg-white hover:bg-neutral-50/50 border-neutral-150 shadow-3xs'
                  }`}
                >
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-black">{card.serviceName}</p>
                    <p className={`text-[10px] font-bold ${theme === 'dark' ? 'text-indigo-200/90' : 'text-indigo-950/80'}`}>
                      PIN: <span className="font-mono font-black select-all bg-indigo-950/40 px-1.5 py-0.5 rounded text-yellow-500 dark:text-yellow-300">{card.cardPin || 'N/A'}</span>
                    </p>
                    <p className="text-[9px] text-neutral-400 dark:text-slate-400">📅 ডেলিভারি: {new Date(card.date).toLocaleDateString('bn-BD')}</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      onViewActiveCard(card);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition-colors border border-indigo-400/30 shadow-md flex items-center space-x-1 cursor-pointer"
                  >
                    <span>View Active Card</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 2. PULSE RATE SUB-CATEGORY SCREEN */}
      {/* 2. CARD OFFER PACKAGE SCREEN */}
      {screen === 'offers' && (
        <div className="space-y-4">
          {/* Controls Bar: Country Selector & Value Filter */}
          <div className="flex flex-col space-y-3 p-4 rounded-2xl border text-left bg-white/40 dark:bg-slate-950/40 border-neutral-150 dark:border-slate-800/60 shadow-4xs">
            {/* Country Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-400 dark:text-slate-400 uppercase tracking-widest block">দেশ সিলেক্ট করুন (Select Country)</label>
              <div className="flex flex-wrap gap-1.5">
                {COUNTRIES.map((cntry) => (
                  <button
                    key={cntry.code}
                    onClick={() => setSelectedCountry(cntry.name)}
                    className={`px-3 py-1.5 rounded-xl border-2 text-[10px] font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
                      selectedCountry === cntry.name
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-102'
                        : theme === 'dark'
                          ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          : 'bg-white border-neutral-150 text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <span className="text-sm leading-none">{cntry.flag}</span>
                    <span>{cntry.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Value Selector ($) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-400 dark:text-slate-400 uppercase tracking-widest block font-sans">কার্ডের মান ফিল্টার (Dollar Value Filter)</label>
              <div className="flex flex-wrap gap-1.5">
                {DOLLAR_VALUES.map((val) => (
                  <button
                    key={val.value}
                    onClick={() => setSelectedDollarVal(val.value)}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer ${
                      selectedDollarVal === val.value
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : theme === 'dark'
                          ? 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                    }`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Empty State Screen ("কোনো কার্ড নেই") */}
          {filteredOffers.length === 0 ? (
            <div className={`p-10 rounded-2xl border-2 border-dashed text-center space-y-3 ${
              theme === 'dark' ? 'bg-slate-950/30 border-slate-800' : 'bg-neutral-50/50 border-neutral-200'
            }`}>
              <div className="w-12 h-12 rounded-full bg-rose-55 dark:bg-rose-950/40 text-rose-550 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`text-xs font-black ${theme === 'dark' ? 'text-slate-200' : 'text-neutral-800'}`}>কোনো কার্ড নেই</h4>
                <p className={`text-[10px] mt-1 font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-neutral-400'}`}>
                  দুঃখিত, {selectedCountry}-এর জন্য কোনো একটিভ {selectedBrand} কার্ড পাওয়া যায়নি। অনুগ্রহ করে অন্য কোনো দেশ বা প্যাকেজ দেখুন।
                </p>
              </div>
            </div>
          ) : (
            /* Active Offers Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {filteredOffers.map((off) => (
                <div
                  key={off.id}
                  className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                    theme === 'dark'
                      ? 'bg-slate-900/60 border-slate-800/85 hover:border-indigo-500/50'
                      : 'bg-white border-neutral-150 hover:border-indigo-500/50 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-indigo-55 dark:bg-indigo-950/40 border border-indigo-100/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span>{off.country}</span>
                    </span>

                    <span className="text-xs font-sans font-black text-rose-600 bg-rose-55 dark:bg-rose-950/40 px-3 py-1 rounded-xl border border-rose-100/30">
                      ${off.value} USD Value
                    </span>
                  </div>

                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between items-baseline">
                      <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
                        {off.minutes}
                      </p>
                      <div className="flex flex-col items-end text-right">
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                          ৳{off.priceBdt} BDT
                        </span>
                        {showForeignCurrency && (
                          <span className="text-[10px] font-bold text-emerald-500 font-mono">
                            ({globalCurrencyName} {(off.priceBdt / globalCurrencyRate).toFixed(2)})
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-[9.5px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>
                      {off.rateDescription}
                    </p>
                  </div>

                  {/* Buy Now button */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-slate-800/60 flex justify-end">
                    <button
                      onClick={() => handleOpenBuyModal(off)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === ORDER REVIEW BOTTOM SHEET / MODAL === */}
      {buyingOffer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border-2 shadow-2xl p-5 text-left transition-all animate-slide-up space-y-4 max-h-[90vh] overflow-y-auto ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-white'
                : 'bg-white border-neutral-150 text-neutral-900'
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="text-xs font-black uppercase text-indigo-500">Order Review (নিশ্চিতকরণ রশিদ)</h3>
                <p className={`text-[9.5px] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-400'}`}>কলিং কার্ড ক্রয় সম্পূর্ণ করতে নিচের তথ্য চেক করুন।</p>
              </div>
              <button 
                onClick={() => setBuyingOffer(null)}
                className={`p-1.5 rounded-lg border cursor-pointer hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors ${
                  theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-neutral-100 text-neutral-400'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error or Success notification */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-150 rounded-xl text-rose-800 text-[10px] font-bold flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-xl text-emerald-800 text-[10px] font-bold space-y-1">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-black">অর্ডার সফলভাবে সাবমিট হয়েছে!</span>
                </div>
                <p className="text-[9px] font-semibold text-emerald-700 leading-relaxed">{successMsg}</p>
                <button
                  onClick={() => {
                    setBuyingOffer(null);
                    onBack();
                  }}
                  className="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black transition-colors cursor-pointer"
                >
                  প্যানেলে ফিরে যান
                </button>
              </div>
            )}

            {!successMsg && (
              <form onSubmit={handleConfirmOrder} className="space-y-4 text-xs font-bold">
                {/* Details Breakdown */}
                <div className={`p-4 rounded-2xl space-y-2.5 border ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-neutral-50/50 border-neutral-150'
                }`}>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-neutral-400 dark:text-slate-400">ব্র্যান্ড (Brand)</span>
                    <span className="text-[11px] font-black">{buyingOffer.brand}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-[10px] text-neutral-400 dark:text-slate-400">দেশ (Country)</span>
                    <span className="text-[11px] font-black">{buyingOffer.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-neutral-400 dark:text-slate-400">কার্ড ভ্যালু (Value)</span>
                    <span className="text-[11px] font-sans font-black text-rose-600">${buyingOffer.value} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-neutral-400 dark:text-slate-400">মিনিট রেট (Rate Breakdown)</span>
                    <span className="text-[11px] font-black text-neutral-700 dark:text-slate-300">{buyingOffer.minutes}</span>
                  </div>
                  <div className="border-t border-neutral-200/50 dark:border-slate-800 pt-2 flex justify-between items-baseline font-mono">
                    <span className="text-[10px] text-neutral-400 dark:text-slate-400 font-sans font-bold">মোট দাম (Total Amount)</span>
                    <div className="text-right">
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block">৳{buyingOffer.priceBdt} BDT</span>
                      {showForeignCurrency && (
                        <span className="text-[10px] font-bold text-emerald-500 block">
                          {globalCurrencyName} {(buyingOffer.priceBdt / globalCurrencyRate).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account / Recipient number input */}
                <div className="flex flex-col space-y-1 text-left">
                  <label className="text-[10px] text-neutral-400 dark:text-slate-400 uppercase tracking-widest">ডায়ালার নম্বর / অ্যাকাউন্ট নম্বর (Account / Phone Number) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    placeholder="যেমন: 017XXXXXXXX"
                    value={recipientNumber}
                    onChange={(e) => setRecipientNumber(e.target.value.replace(/\D/g, ''))}
                    className={`p-3 border rounded-xl text-xs font-black focus:outline-none focus:border-indigo-500 text-center tracking-wide ${
                      theme === 'dark' 
                        ? 'bg-slate-950 border-slate-800 text-white' 
                        : 'bg-white border-neutral-250 text-neutral-900'
                    }`}
                  />
                  <p className="text-[8.5px] font-medium text-neutral-400 dark:text-slate-500 leading-normal">যে মোবাইল/ডায়ালারে কলিং কার্ড ব্যালেন্স সক্রিয় বা পিন এসএমএস করা হবে।</p>
                </div>

                {/* PIN input field */}
                <div className="flex flex-col space-y-1 text-left">
                  <label className="text-[10px] text-neutral-400 dark:text-slate-400 uppercase tracking-widest">সিকিউরিটি পিন নম্বর (Security PIN) *</label>
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    className={`p-3 border rounded-xl text-xs font-black focus:outline-none focus:border-indigo-500 text-center tracking-widest ${
                      theme === 'dark' 
                        ? 'bg-slate-950 border-slate-800 text-white' 
                        : 'bg-white border-neutral-250 text-neutral-900'
                    }`}
                  />
                </div>

                {/* Submit green button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span>{loading ? 'প্রসেসিং হচ্ছে...' : 'নিশ্চিত করুন'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
