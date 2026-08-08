import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';

interface InteractiveVipCardProps {
  user: any;
  language: 'BN' | 'EN';
  balanceRevealed: boolean;
  onRevealToggle: () => void;
  playAudio: (type: 'click' | 'success' | 'popup' | 'error') => void;
  currencyName?: string;
  currencyRate?: number;
  onCurrencyClick?: () => void;
  showForeignCurrency?: boolean;
}

export default function InteractiveVipCard({
  user,
  language,
  balanceRevealed,
  onRevealToggle,
  playAudio,
  currencyName = 'USD',
  currencyRate = 120,
  showForeignCurrency = false,
  onCurrencyClick
}: InteractiveVipCardProps) {
  const [coords, setCoords] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const rotateX = -y / 8;
    const rotateY = x / 12;
    setCoords({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ rotateX: 0, rotateY: 0 });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRevealToggle();
    playAudio('click');
  };

  return (
    <div className="perspective-1000 py-1 select-none">
      <style>{`
        @keyframes wave-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-wave-flow {
          background-size: 200% 200%;
          animation: wave-flow 12s ease infinite;
        }
        .grid-overlay {
          background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 16px 16px;
        }
      `}</style>

      {/* Holographic VIP Member Card */}
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered 
            ? `perspective(1000px) rotateX(${coords.rotateX}deg) rotateY(${coords.rotateY}deg) scale(1.025)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
          transition: isHovered ? 'none' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        className="w-full h-52 rounded-[24px] bg-gradient-to-tr from-[#025a69] via-[#012542] to-[#120736] animate-wave-flow border border-cyan-400/40 text-white relative overflow-hidden shadow-xl shadow-cyan-950/30 flex flex-col justify-between p-6 cursor-pointer active:scale-[0.99] group"
      >
        {/* Holographic Wave Wires and Grid Effect */}
        <div className="absolute inset-0 grid-overlay opacity-40 mix-blend-overlay pointer-events-none"></div>
        
        {/* Abstract glowing waves in background */}
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-[#06b6d4]/20 rounded-full blur-3xl pointer-events-none group-hover:bg-[#06b6d4]/30 transition-all duration-500"></div>
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-[#4f46e5]/15 rounded-full blur-3xl pointer-events-none group-hover:bg-[#4f46e5]/25 transition-all duration-500"></div>

        {/* Top Section: User Name & Platinum badge */}
        <div className="flex justify-between items-start z-10 relative">
          <div className="space-y-1 text-left">
            <h3 className="text-xl font-extrabold tracking-tight text-white/95">
              {user.name}
            </h3>
            <div className="inline-flex items-center space-x-1.5 bg-cyan-950/40 border border-cyan-500/30 px-3 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[10px] font-bold text-cyan-300 tracking-wide">
                {user.role === 'Admin' || user.role === 'Sub-Admin' ? 'Platinum Member' : `${user.role} Member`}
              </span>
            </div>
          </div>

          {/* Golden/Silver 3D Shield VIP Badge (Premium SVG Graphic) */}
          <div className="w-16 h-16 drop-shadow-[0_4px_12px_rgba(234,179,8,0.35)] relative shrink-0 group-hover:scale-110 transition-transform duration-300">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Outer Golden Shield border with 3D metallic gradient */}
              <defs>
                <linearGradient id="gold-metal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="30%" stopColor="#FDE047" />
                  <stop offset="50%" stopColor="#B45309" />
                  <stop offset="75%" stopColor="#FDE047" />
                  <stop offset="100%" stopColor="#78350F" />
                </linearGradient>
                <linearGradient id="shield-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
              </defs>
              
              {/* Outer Shield Border */}
              <path d="M50 12 L82 25 C82 55 68 78 50 88 C32 78 18 55 18 25 L50 12 Z" fill="url(#gold-metal)" />
              {/* Inner Shield Body */}
              <path d="M50 17 L77 28 C77 53 65 74 50 83 C35 74 23 53 23 28 L50 17 Z" fill="url(#shield-bg)" />
              
              {/* "VIP" text and Star */}
              <text x="50" y="52" fill="url(#gold-metal)" fontSize="18" fontWeight="900" textAnchor="middle" letterSpacing="0.5">VIP</text>
              {/* Small Gold Star under VIP */}
              <path d="M50 58 L52 63 L57 63 L53 66 L55 71 L50 68 L45 71 L47 66 L43 63 L48 63 Z" fill="#FDE047" />
            </svg>
          </div>
        </div>

        {/* Middle Section: Wallet Balance & Tap Button */}
        <div className="z-10 text-left space-y-1 relative" onClick={handleCardClick}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-slate-300">
              <span className="text-[10px] font-bold tracking-wider uppercase">Wallet Balance</span>
              <div className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0">
                {balanceRevealed ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); if(onCurrencyClick) onCurrencyClick(); }} 
              className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-900/30 hover:bg-emerald-800/40 px-2 py-0.5 rounded-md border border-emerald-500/30 cursor-pointer active:scale-95 transition-all flex items-center space-x-1 z-20 relative"
            >
              <span>{showForeignCurrency ? currencyName : 'Select Currency'} ▾</span>
              {showForeignCurrency && (
                <span className="ml-1 text-white font-mono">
                  {balanceRevealed ? (user.walletBalance / currencyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '•••'}
                </span>
              )}
            </button>
          </div>
          
          <div className="flex flex-col items-start mt-1">
            <div className="h-9 flex items-center">
              <span className={`text-2xl font-black font-mono tracking-tight text-white transition-all duration-300 ${balanceRevealed ? 'block' : 'hidden'}`}>
                ৳ {user.walletBalance.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-xl font-extrabold tracking-widest text-cyan-300/80 font-mono transition-all duration-300 ${balanceRevealed ? 'hidden' : 'block'}`}>
                ••••••••
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Phone Number ID / Verification Badge */}
        <div className="flex justify-between items-end z-10 relative pt-2 border-t border-white/10">
          <div className="text-left">
            <p className="text-[11px] font-mono text-slate-100 font-bold tracking-widest">{user.phone}</p>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Wallet ID</p>
          </div>

          <div className="flex items-center space-x-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="text-[9px] font-black text-slate-200 tracking-wide">Secure Wallet</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[8px] font-extrabold text-emerald-400 uppercase tracking-widest">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
