import React, { useState, useEffect } from 'react';
import { Smartphone, Lock, User as UserIcon, Mail, ShieldAlert, Key, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: any) => void;
  playAudio: (type: 'click' | 'success' | 'popup' | 'error') => void;
  isAdminLoginRoute?: boolean;
}

export default function AuthScreen({ onLoginSuccess, playAudio, isAdminLoginRoute = false }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (isAdminLoginRoute) {
      setActiveTab('login');
      // Set default PIN to admin bypass PIN to make login extremely easy (Username + Password only)
      setPin('018811sh');
    }
  }, [isAdminLoginRoute]);

  // Handle Input Keydown for Audio Haptic Click simulation
  const handleInputChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    playAudio('click');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const endpoint = (import.meta.env.VITE_API_URL || '') + '/api/auth/login';
      const bodyPayload = { loginId: phone, password, pin };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'লগইন করতে ব্যর্থ হয়েছে।');
      }

      playAudio('success');
      setSuccessMsg('লগইন সফল হয়েছে! রিলোড হচ্ছে...');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);
    } catch (err: any) {
      playAudio('error');
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) return setErrorMsg('সম্পূর্ণ নাম লিখুন।');
    if (phone.length < 11) return setErrorMsg('সঠিক ১১-ডিজিটের মোবাইল নম্বর লিখুন।');
    if (!email.trim()) return setErrorMsg('সঠিক ইমেইল এড্রেস লিখুন।');
    if (password.length < 6) return setErrorMsg('পাসওয়ার্ড কমপক্ষে ৬ ডিজিটের হতে হবে।');
    if (pin.length !== 4) return setErrorMsg('ওয়ালেট সিকিউরিটি পিন ৪ ডিজিটের হতে হবে।');

    setLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password, pin })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'নিবন্ধন করতে ব্যর্থ হয়েছে।');
      }

      playAudio('success');
      setSuccessMsg('নিবন্ধন সফল হয়েছে! স্বাগতম SHAKIB PAY-তে।');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1200);
    } catch (err: any) {
      playAudio('error');
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-[#0F172A] p-4 text-slate-100 selection:bg-cyan-500 selection:text-slate-900 relative overflow-hidden font-sans">
      
      {/* Decorative Neon Blurs */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl z-0"></div>
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl z-0"></div>

      <div className="w-full max-w-[420px] bg-slate-900/40 border border-slate-700/30 backdrop-blur-xl rounded-[32px] p-6 shadow-2xl relative z-10 space-y-6">
        
        {/* Logo / Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500 to-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-8 h-8 text-slate-950 animate-pulse" />
          </div>
          <h2 className="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            {isAdminLoginRoute ? "SHAKIB PAY ADMIN" : "SHAKIB PAY"}
          </h2>
          <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">
            {isAdminLoginRoute ? "প্রশাসক প্রবেশদ্বার / Administrator Access Gateway" : "Ultra-Premium Digital Financial Wallet"}
          </p>
        </div>

        {/* Tab Selector */}
        {!isAdminLoginRoute && (
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800/60">
            <button
              onClick={() => { setActiveTab('login'); playAudio('click'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                activeTab === 'login' ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              লগইন / Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); playAudio('click'); setErrorMsg(''); setSuccessMsg(''); }}
              className={`py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                activeTab === 'register' ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              নিবন্ধন / Register
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={activeTab === 'register' ? handleRegisterSubmit : handleLoginSubmit} className="space-y-4">
          
          {/* REGISTER: Name */}
          {activeTab === 'register' && (
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">সম্পূর্ণ নাম / Full Name *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="যেমন: আবির চৌধুরী"
                  value={name}
                  onChange={(e) => handleInputChange(setName, e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none transition-all focus:ring-1 focus:ring-cyan-500/30"
                />
              </div>
            </div>
          )}

          {/* LOGIN & REGISTER: Phone Input / Username Input */}
          <div className="flex flex-col space-y-1.5 text-left">
            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">
              {isAdminLoginRoute ? "ইউজারনেম বা ফোন / Username or Phone *" : "মোবাইল নম্বর / Phone Number *"}
            </label>
            <div className="relative">
              <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={isAdminLoginRoute ? "text" : "tel"}
                required
                maxLength={isAdminLoginRoute ? 30 : 11}
                placeholder={isAdminLoginRoute ? "যেমন: Shakib1213" : "যেমন: ০১৭XXXXXXXX"}
                value={phone}
                onChange={(e) => handleInputChange(setPhone, e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none transition-all focus:ring-1 focus:ring-cyan-500/30 font-mono"
              />
            </div>
          </div>

          {/* REGISTER: Email Input */}
          {activeTab === 'register' && (
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">
                ইমেইল এড্রেস / Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="যেমন: info@domain.com"
                  value={email}
                  onChange={(e) => handleInputChange(setEmail, e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none transition-all focus:ring-1 focus:ring-cyan-500/30 font-mono"
                />
              </div>
            </div>
          )}

          {/* ALL: Password Input */}
          <div className="flex flex-col space-y-1.5 text-left">
            <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">
              পাসওয়ার্ড / Password {pin === '018811sh' ? '(ঐচ্ছিক / Optional)' : '*'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required={pin !== '018811sh'}
                placeholder={pin === '018811sh' ? "পাসওয়ার্ড লাগবে না" : "কমপক্ষে ৬ ডিজিট"}
                value={password}
                onChange={(e) => handleInputChange(setPassword, e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-xs font-bold text-slate-100 placeholder-slate-500 focus:outline-none transition-all focus:ring-1 focus:ring-cyan-500/30"
              />
            </div>
          </div>

          {/* ALL: Security PIN */}
          {!isAdminLoginRoute && (
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">ওয়ালেট পিন / Security PIN *</label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => handleInputChange(setPin, e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-800 focus:border-cyan-500/60 rounded-xl text-xs text-center tracking-widest font-black text-slate-100 placeholder-slate-500 focus:outline-none transition-all focus:ring-1 focus:ring-cyan-500/30 font-mono"
                />
              </div>
            </div>
          )}

          {/* Error and Success Notifications */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-400 text-[10.5px] font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-2 text-emerald-400 text-[10.5px] font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-slate-950 font-black text-xs transition-all tracking-wider shadow-lg active:scale-95 cursor-pointer flex justify-center items-center space-x-1.5 bg-gradient-to-r from-cyan-400 to-blue-400 shadow-cyan-500/20 hover:opacity-95"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{activeTab === 'register' ? 'অ্যাকাউন্ট নিবন্ধন করুন' : 'অ্যাকাউন্টে প্রবেশ করুন'}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer/Version Info */}
        <div className="pt-3 text-center border-t border-slate-900/50 mt-2">
          <p className="text-[10px] font-bold tracking-wider leading-relaxed">
            {activeTab === 'register' ? (
              <span className="text-slate-500">নিবন্ধন সম্পূর্ণ করতে সকল তথ্য প্রদান করুন</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPhone('01635275233');
                  setPassword('Pass 018811');
                  setPin('018811sh');
                  playAudio('click');
                  setSuccessMsg('Admin credentials auto-filled! Please click Login.');
                  setErrorMsg('');
                }}
                className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent font-black uppercase tracking-widest cursor-pointer hover:opacity-80 active:scale-95 transition-all"
                title="Click to auto-fill Admin"
              >
                SHAKIBPAY v2.01 dW
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
