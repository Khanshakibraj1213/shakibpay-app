const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const navStart = code.indexOf('{/* BOTTOM NAVIGATION BAR */}');
const navEnd = code.indexOf('{/* =======================================');

if (navStart !== -1 && navEnd !== -1) {
  const newNavCode = `        {/* BOTTOM NAVIGATION BAR */}
        {!isAdminMode && (
          <div className={\`absolute bottom-0 left-0 right-0 z-30 h-16 flex items-center justify-around rounded-b-[40px] sm:rounded-b-[40px] transition-all duration-300 \${
            theme === 'dark' 
              ? 'bg-[#0B0F19]/95 border-t border-slate-800/80 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]' 
              : 'bg-white/95 border-t border-neutral-100/80 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
          }\`}>
            {[
              { id: 'home', label: 'Home', icon: Home, action: () => handleTabClick('home') },
              { id: 'history', label: 'History', icon: History, action: () => handleTabClick('history') },
              { id: 'scan', label: 'Scan & Pay', icon: QrCode, action: () => { playAudio('click'); alert(language === 'BN' ? 'কিউআর কোড স্ক্যানার সক্রিয় করা হচ্ছে...' : 'Initializing Secure QR Code Reader...'); } },
              { id: 'offers', label: 'Offers', icon: Sparkles, action: () => { playAudio('click'); setOffersMode('internet'); setActivePanel('offers'); } },
              { id: 'profile', label: 'Profile', icon: UserIcon, action: () => handleTabClick('profile') }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSel = currentTab === tab.id && !isAdminMode && activePanel === 'dashboard';

              if (tab.id === 'scan') {
                return (
                  <button
                    key={tab.id}
                    onClick={tab.action}
                    className="relative flex flex-col items-center justify-center cursor-pointer group px-2 -mt-6"
                  >
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/40 border-4 border-[#0B0F19] text-white active:scale-95 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className={\`text-[9px] font-black mt-1.5 tracking-tight \${
                      theme === 'dark' ? 'text-slate-300' : 'text-neutral-500'
                    }\`}>{tab.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={tab.action}
                  className="flex flex-col items-center justify-center h-full px-4 cursor-pointer group active:scale-95 transition-transform"
                >
                  <div className={\`p-1.5 rounded-xl transition-all \${
                    isSel 
                      ? theme === 'dark'
                        ? 'text-indigo-400'
                        : 'text-indigo-600' 
                      : theme === 'dark'
                        ? 'text-slate-500 group-hover:text-slate-300'
                        : 'text-neutral-400 group-hover:text-neutral-600'
                  }\`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={\`text-[9px] font-black mt-0.5 tracking-tight transition-all \${
                    isSel 
                      ? theme === 'dark'
                        ? 'text-indigo-400 font-extrabold'
                        : 'text-indigo-600 font-extrabold'
                      : theme === 'dark'
                        ? 'text-slate-500'
                        : 'text-neutral-400'
                  }\`}>{tab.label}</span>
                  {isSel && (
                    <div className={\`w-1 h-1 rounded-full mt-0.5 \${theme === 'dark' ? 'bg-indigo-400' : 'bg-indigo-600'}\`}></div>
                  )}
                </button>
              );
            })}
          </div>
        )}

`;
  code = code.substring(0, navStart) + newNavCode + code.substring(navEnd);
  fs.writeFileSync('src/App.tsx', code);
}
