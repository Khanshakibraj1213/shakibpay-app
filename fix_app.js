const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Find the start of the getGreeting function
const getGreetingStart = code.indexOf('  const getGreeting = () => {');

// Find where the ADMIN MAINTENANCE BANNER starts
const adminBannerStart = code.indexOf('        {/* ADMIN MAINTENANCE BANNER */}');

const correctCode = `  const getGreeting = () => {
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
      <div className={\`w-9 h-9 rounded-lg flex items-center justify-center border border-neutral-100 \${colorClass} shrink-0 shadow-4xs\`}>
        <FallbackIcon className="w-4.5 h-4.5" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-neutral-800 font-sans leading-relaxed selection:bg-indigo-600 selection:text-white flex justify-center items-start sm:py-6 relative overflow-x-hidden">
      
      {/* KEYFRAMES FOR MARQUEE */}
      <style>{\`
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
      \`}</style>

      {/* PHONE WRAPPER SIMULATOR FRAME */}
      <div className={\`w-full min-h-screen sm:min-h-[850px] sm:rounded-[48px] overflow-y-auto shadow-2xl relative flex flex-col pb-24 border-[8px] border-neutral-900 scrollbar-none transition-all duration-300 \${
        theme === 'dark' 
          ? 'bg-[#0B0F19] text-slate-100' 
          : 'bg-[#F8FAFC] text-neutral-800'
      } \${
        isAdminMode && activePanel === 'admin'
          ? 'max-w-6xl sm:max-h-[960px]'
          : 'max-w-[430px] sm:max-h-[920px]'
      }\`} id="phone-container">
        
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
        <div className={\`p-4 flex items-center justify-between shrink-0 sticky top-0 sm:top-0 z-20 shadow-lg backdrop-blur-md transition-all duration-300 \${
          theme === 'dark' 
            ? 'bg-[#0B0F19]/95 border-b border-slate-800/80 text-slate-100' 
            : 'bg-[#F8FAFC]/95 border-b border-neutral-200/80 text-neutral-800'
        }\`}>
          <div className="flex items-center space-x-3">
            <div className="relative group cursor-pointer" onClick={() => handleTabClick('profile')}>
              <img
                src={user.profilePic || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"}
                alt={user.name}
                referrerPolicy="no-referrer"
                className={\`w-12 h-12 rounded-full object-cover border-2 shadow-md transition-transform duration-300 group-hover:scale-105 \${
                  theme === 'dark' ? 'border-indigo-500/30' : 'border-indigo-200'
                }\`}
              />
            </div>
            <div className="text-left space-y-1">
              <div className="flex items-center space-x-1.5">
                <span className={\`text-[15px] font-black tracking-tight leading-none \${theme === 'dark' ? 'text-white' : 'text-neutral-900'}\`}>
                  Hi, {user.name} 👋
                </span>
              </div>
              <span className={\`text-[11px] block font-bold leading-none \${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}\`}>
                Welcome back!
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Search Button */}
            <button
              className={\`p-2 rounded-full transition-all border \${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800' 
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }\`}
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Notification bell with notch dot */}
            <button 
              onClick={() => {
                setIsPushModalOpen(true);
                playAudio('click');
              }}
              className={\`relative p-2 rounded-full transition-all border \${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800' 
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }\`}
            >
              <Bell className="w-4.5 h-4.5" />
              <span className={\`absolute top-0 right-0 flex h-4 w-4 items-center justify-center bg-rose-500 rounded-full border-2 text-[8px] font-bold text-white \${theme === 'dark' ? 'border-[#0B0F19]' : 'border-[#F8FAFC]'}\`}>3</span>
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
`;

code = code.substring(0, getGreetingStart) + correctCode + code.substring(adminBannerStart);
fs.writeFileSync('src/App.tsx', code);
