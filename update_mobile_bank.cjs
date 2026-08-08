const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const mobileBankStart = code.indexOf('{/* MOBILE BANKING ROW */}');
const todaySummaryStart = code.indexOf('{/* TODAY\'S SUMMARY */}');

if (mobileBankStart !== -1 && todaySummaryStart !== -1) {
  const newMobileBank = `{/* MOBILE BANKING ROW */}
                  <div className="text-left pt-2">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className={\`text-sm font-black tracking-tight \${theme === 'dark' ? 'text-white' : 'text-neutral-900'}\`}>Mobile Banking</h3>
                      <button className={\`text-[11px] font-bold flex items-center space-x-0.5 \${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}\`}>
                        <span>See All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex space-x-3 overflow-x-auto scrollbar-none pb-2">
                      {(() => {
                        let mfsServices = services.filter(s => s.type === 'Mobile Bank' && s.isEnabled).sort((a,b) => a.sortOrder - b.sortOrder);
                        
                        return mfsServices.map((item, idx) => {
                          let IconComponent = Wallet;
                          let iconColor = 'text-slate-500';
                          let codeParam = 'more';
                          
                          if (item.slug === 'bkash') { IconComponent = Coins; iconColor = 'text-pink-600'; codeParam = 'bkash'; }
                          else if (item.slug === 'nagad') { IconComponent = Flame; iconColor = 'text-orange-500'; codeParam = 'nagad'; }
                          else if (item.slug === 'rocket') { IconComponent = Rocket; iconColor = 'text-purple-600'; codeParam = 'rocket'; }
                          else if (item.slug === 'upay') { IconComponent = Activity; iconColor = 'text-amber-500'; codeParam = 'upay'; }
                          else if (item.slug === 'selfin') { IconComponent = Shield; iconColor = 'text-teal-600'; codeParam = 'more'; }
                          else if (item.slug === 'mcash') { IconComponent = Wallet; iconColor = 'text-green-600'; codeParam = 'more'; }
                          else if (item.slug === 'surecash') { IconComponent = CreditCard; iconColor = 'text-emerald-500'; codeParam = 'more'; }
                          else if (item.slug === 'tap') { IconComponent = Fingerprint; iconColor = 'text-cyan-600'; codeParam = 'more'; }
                          else { IconComponent = Coins; iconColor = 'text-indigo-500'; codeParam = 'more'; }
                          
                          return (
                            <button key={item.id || idx} className="flex flex-col items-center flex-shrink-0 space-y-1.5 cursor-pointer active:scale-95 transition-transform" onClick={() => { setTransferMfsProvider(codeParam === 'more' ? null : codeParam); setActivePanel('mfs-transfer'); playAudio('click'); }}>
                              <div className="w-14 h-12 bg-white rounded-xl shadow-sm border border-neutral-150 flex items-center justify-center overflow-hidden p-1">
                                {item.icon ? (
                                  <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
                                ) : (
                                  <IconComponent className={\`w-6 h-6 \${iconColor}\`} />
                                )}
                              </div>
                              <span className={\`text-[10px] font-black \${theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'}\`}>{item.name}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  `;
  code = code.substring(0, mobileBankStart) + newMobileBank + code.substring(todaySummaryStart);
  fs.writeFileSync('src/App.tsx', code);
}
