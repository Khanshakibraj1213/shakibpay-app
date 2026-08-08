const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const dashboardStart = code.indexOf('{/* Section 3: Auto Banner Offer Slider */}');
const dashboardEnd = code.indexOf('{/* Section 8: Quick Utilities (BTRC, Helpline, Calculator) */}');

if (dashboardStart !== -1 && dashboardEnd !== -1) {
  const newDashboardCode = `                  {/* --- NEW GRID & SECTIONS MATCHING SCREENSHOT --- */}
                  
                  {/* MAIN 8-BUTTON GRID */}
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    {[
                      { label: "Add Money", icon: "Plus", colorClass: "bg-emerald-500 shadow-emerald-500/20", iconColor: "text-white", action: () => { setMfsProvider('bkash'); setActivePanel('mfs'); } },
                      { label: "Send Money", icon: "Send", colorClass: "bg-violet-600 shadow-violet-600/20", iconColor: "text-white", action: () => setIsSendMoneyOpen(true) },
                      { label: "Drive Pack", icon: "Package", colorClass: "bg-orange-500 shadow-orange-500/20", iconColor: "text-white", action: () => { setOffersMode('drive'); setActivePanel('offers'); } },
                      { label: "Recharge", icon: "Smartphone", colorClass: "bg-blue-500 shadow-blue-500/20", iconColor: "text-white", action: () => setIsRechargeModalOpen(true) },
                      { label: "Pay Bill", icon: "Receipt", colorClass: "bg-rose-500 shadow-rose-500/20", iconColor: "text-white", action: () => { setSelectedUtility('Electricity'); const el = document.getElementById('utility-card'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
                      { label: "Banking", icon: "Building2", colorClass: "bg-indigo-600 shadow-indigo-600/20", iconColor: "text-white", action: () => setActivePanel('banking') },
                      { label: "Agent Bill", icon: "Users", colorClass: "bg-teal-500 shadow-teal-500/20", iconColor: "text-white", action: () => setIsAddUserOpen(true) },
                      { label: "E-Commerce", icon: "ShoppingBag", colorClass: "bg-amber-500 shadow-amber-500/20", iconColor: "text-white", action: () => {} }
                    ].map((serv, idx) => {
                      const Icon = require('lucide-react')[serv.icon] || (() => <span />);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => { serv.action(); playAudio('click'); }}
                          className={\`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer active:scale-95 \${
                            theme === 'dark' 
                              ? 'bg-[#141A28] border-slate-800/60 hover:bg-slate-800/80' 
                              : 'bg-white border-neutral-100 hover:bg-neutral-50 shadow-sm'
                          }\`}
                        >
                          <div className={\`w-12 h-10 rounded-xl flex items-center justify-center mb-2 shadow-md \${serv.colorClass}\`}>
                            <Icon className={\`w-5 h-5 \${serv.iconColor}\`} />
                          </div>
                          <span className={\`text-[10px] font-black tracking-tight text-center leading-tight \${
                            theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'
                          }\`}>{serv.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* PROMO BANNER */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white shadow-lg p-5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform" onClick={() => { setOffersMode('internet'); setActivePanel('offers'); playAudio('click'); }}>
                    <div className="absolute right-0 top-0 w-32 h-full opacity-20 pointer-events-none">
                       <Wifi className="w-full h-full text-white" strokeWidth={0.5} />
                    </div>
                    <div className="space-y-2 relative z-10 text-left">
                      <h3 className="text-[17px] font-black leading-tight drop-shadow-md">ইন্টারনেট প্যাকেজ কিনুন</h3>
                      <p className="text-[11px] font-bold text-indigo-100 drop-shadow-sm">সেরা অফারে – দ্রুত, সহজ ও নিরাপদ</p>
                      <button className="mt-1 px-4 py-1.5 bg-indigo-900/50 hover:bg-indigo-900/70 border border-indigo-400/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 transition-colors">
                        <span>এখনই কিনুন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="relative z-10 w-20 h-20 bg-indigo-500/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-indigo-400/20">
                      <Wifi className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  {/* MOBILE BANKING ROW */}
                  <div className="text-left pt-2">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={\`text-sm font-black tracking-tight \${theme === 'dark' ? 'text-white' : 'text-neutral-900'}\`}>Mobile Banking</h3>
                      <button className={\`text-[11px] font-bold flex items-center space-x-0.5 \${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}\`}>
                        <span>See All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex space-x-3 overflow-x-auto scrollbar-none pb-2">
                      {[
                        { label: 'bKash', icon: 'Coins', color: 'text-pink-600', code: 'bkash' },
                        { label: 'Nagad', icon: 'Flame', color: 'text-orange-500', code: 'nagad' },
                        { label: 'Rocket', icon: 'Rocket', color: 'text-purple-600', code: 'rocket' },
                        { label: 'Upay', icon: 'Activity', color: 'text-amber-500', code: 'upay' },
                        { label: 'Selfin', icon: 'Shield', color: 'text-teal-600', code: 'more' },
                        { label: 'M Cash', icon: 'Wallet', color: 'text-green-600', code: 'more' },
                        { label: 'SureCash', icon: 'CreditCard', color: 'text-emerald-500', code: 'more' },
                        { label: 'Tap', icon: 'Fingerprint', color: 'text-cyan-600', code: 'more' }
                      ].map((item, idx) => {
                        const Icon = require('lucide-react')[item.icon] || (() => <span />);
                        return (
                          <button key={idx} className="flex flex-col items-center flex-shrink-0 space-y-1.5 cursor-pointer active:scale-95 transition-transform" onClick={() => { setTransferMfsProvider(item.code === 'more' ? null : item.code); setActivePanel('mfs-transfer'); playAudio('click'); }}>
                            <div className="w-14 h-12 bg-white rounded-xl shadow-sm border border-neutral-150 flex items-center justify-center">
                              <Icon className={\`w-6 h-6 \${item.color}\`} />
                            </div>
                            <span className={\`text-[10px] font-black \${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}\`}>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* TODAY'S SUMMARY */}
                  <div className="text-left pt-2">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={\`text-sm font-black tracking-tight \${theme === 'dark' ? 'text-white' : 'text-neutral-900'}\`}>আজকের সারাংশ</h3>
                      <button className={\`text-[11px] font-bold flex items-center space-x-0.5 \${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}\`}>
                        <span>All Stats</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={\`p-3 rounded-2xl border flex flex-col justify-between space-y-3 \${theme === 'dark' ? 'bg-[#141A28] border-[#1D253B]' : 'bg-white border-neutral-150'}\`}>
                        <div className={\`w-7 h-7 rounded-lg flex items-center justify-center \${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-50'}\`}>
                          <Wallet className={\`w-3.5 h-3.5 \${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}\`} />
                        </div>
                        <div>
                          <p className={\`text-[10px] font-bold mb-0.5 \${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}\`}>Total Balance</p>
                          <p className={\`text-sm font-black tracking-tight \${theme === 'dark' ? 'text-white' : 'text-neutral-900'}\`}>৳ {user.walletBalance.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                      
                      <div className={\`p-3 rounded-2xl border flex flex-col justify-between space-y-3 \${theme === 'dark' ? 'bg-[#141A28] border-[#1D253B]' : 'bg-white border-neutral-150'}\`}>
                        <div className={\`w-7 h-7 rounded-lg flex items-center justify-center \${theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-50'}\`}>
                          <ArrowRightLeft className={\`w-3.5 h-3.5 \${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}\`} />
                        </div>
                        <div>
                          <p className={\`text-[10px] font-bold mb-0.5 \${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}\`}>Today's Trans</p>
                          <p className={\`text-sm font-black tracking-tight \${theme === 'dark' ? 'text-white' : 'text-neutral-900'}\`}>৳ {orders.filter(o => new Date(o.date).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + (o.amount||0), 0).toLocaleString('bn-BD', {minimumFractionDigits: 0}) || '0'}</p>
                        </div>
                      </div>

                      <div className={\`p-3 rounded-2xl border flex flex-col justify-between space-y-3 \${theme === 'dark' ? 'bg-[#141A28] border-[#1D253B]' : 'bg-white border-neutral-150'}\`}>
                        <div className={\`w-7 h-7 rounded-lg flex items-center justify-center \${theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-50'}\`}>
                          <Users className={\`w-3.5 h-3.5 \${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}\`} />
                        </div>
                        <div>
                          <p className={\`text-[10px] font-bold mb-0.5 \${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}\`}>Total Users</p>
                          <p className={\`text-sm font-black tracking-tight \${theme === 'dark' ? 'text-white' : 'text-neutral-900'}\`}>{allUsers.length}</p>
                        </div>
                      </div>

                      <div className={\`p-3 rounded-2xl border flex flex-col justify-between space-y-3 \${theme === 'dark' ? 'bg-[#141A28] border-[#1D253B]' : 'bg-white border-neutral-150'}\`}>
                        <div className={\`w-7 h-7 rounded-lg flex items-center justify-center \${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-50'}\`}>
                          <CheckCircle className={\`w-3.5 h-3.5 \${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}\`} />
                        </div>
                        <div>
                          <p className={\`text-[10px] font-bold mb-0.5 \${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}\`}>Successful Trx</p>
                          <p className={\`text-sm font-black tracking-tight \${theme === 'dark' ? 'text-white' : 'text-neutral-900'}\`}>{orders.length > 0 ? Math.round((orders.filter(o => o.status === 'Success').length / orders.length) * 100) : 0}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* QUICK ACCESS */}
                  <div className="text-left pt-2 pb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={\`text-sm font-black tracking-tight \${theme === 'dark' ? 'text-white' : 'text-neutral-900'}\`}>দ্রুত অ্যাক্সেস</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Add Balance", icon: "Plus", color: "text-emerald-500", action: () => { setMfsProvider('bkash'); setActivePanel('mfs'); } },
                        { label: "Send Money", icon: "Send", color: "text-violet-500", action: () => setIsSendMoneyOpen(true) },
                        { label: "Recharge", icon: "Smartphone", color: "text-blue-500", action: () => setIsRechargeModalOpen(true) },
                        { label: "Pay Bill", icon: "Receipt", color: "text-rose-500", action: () => { setSelectedUtility('Electricity'); const el = document.getElementById('utility-card'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } }
                      ].map((act, idx) => {
                        const Icon = require('lucide-react')[act.icon] || (() => <span />);
                        return (
                          <button 
                            key={idx}
                            onClick={() => { act.action(); playAudio('click'); }}
                            className={\`flex items-center space-x-1.5 p-2 rounded-xl border transition-colors active:scale-95 \${
                              theme === 'dark' ? 'bg-[#141A28] border-[#1D253B] hover:bg-[#1D253B]' : 'bg-white border-neutral-200 hover:bg-neutral-50'
                            }\`}
                          >
                            <Icon className={\`w-3.5 h-3.5 shrink-0 \${act.color}\`} />
                            <span className={\`text-[10px] font-black whitespace-nowrap overflow-hidden text-ellipsis \${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}\`}>{act.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
`;

  code = code.substring(0, dashboardStart) + newDashboardCode + code.substring(dashboardEnd);
  
  // Also we need to modify the bottom navigation to match the floating Scan & Pay button
  const bottomNavStart = code.indexOf('{/* FIXED BOTTOM NAVIGATION */}');
  const bottomNavEnd = code.indexOf('export default App;');
  
  // We'll replace it via string match later if needed, but let's just write this code out.
  fs.writeFileSync('src/App.tsx', code);
}
