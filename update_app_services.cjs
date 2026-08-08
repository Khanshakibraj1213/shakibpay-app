const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const mainGridStart = code.indexOf('{/* MAIN 8-BUTTON GRID */}');
const promoBannerStart = code.indexOf('{/* PROMO BANNER */}');

if (mainGridStart !== -1 && promoBannerStart !== -1) {
  const newMainGrid = `{/* MAIN 8-BUTTON GRID */}
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    {(() => {
                      // Filter services for Main Grid and sort by sortOrder
                      let mainServices = services.filter(s => s.type === 'Main Grid' && s.isEnabled).sort((a,b) => a.sortOrder - b.sortOrder);
                      // If no main services, provide fallback from original array? The server has them.
                      
                      return mainServices.map((serv, idx) => {
                        let IconComponent = ShoppingBag;
                        let colorClass = "bg-amber-500 shadow-amber-500/20";
                        let action = () => {};
                        
                        if (serv.slug === 'add_money') { IconComponent = Plus; colorClass = "bg-emerald-500 shadow-emerald-500/20"; action = () => { setMfsProvider('bkash'); setActivePanel('mfs'); }; }
                        else if (serv.slug === 'send_money') { IconComponent = Send; colorClass = "bg-violet-600 shadow-violet-600/20"; action = () => setIsSendMoneyOpen(true); }
                        else if (serv.slug === 'drive') { IconComponent = Package; colorClass = "bg-orange-500 shadow-orange-500/20"; action = () => { setOffersMode('drive'); setActivePanel('offers'); }; }
                        else if (serv.slug === 'recharge') { IconComponent = Smartphone; colorClass = "bg-blue-500 shadow-blue-500/20"; action = () => setActivePanel('recharge'); }
                        else if (serv.slug === 'bill') { IconComponent = Receipt; colorClass = "bg-rose-500 shadow-rose-500/20"; action = () => { setSelectedUtility('Electricity'); const el = document.getElementById('utility-card'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }; }
                        else if (serv.slug === 'banking') { IconComponent = Building2; colorClass = "bg-indigo-600 shadow-indigo-600/20"; action = () => setActivePanel('banking'); }
                        else if (serv.slug === 'make_agent') { IconComponent = Users; colorClass = "bg-teal-500 shadow-teal-500/20"; action = () => setIsAddUserOpen(true); }
                        else if (serv.slug === 'ecommerce') { IconComponent = ShoppingBag; colorClass = "bg-amber-500 shadow-amber-500/20"; action = () => {}; }
                        else {
                           IconComponent = Sparkles; // fallback
                           colorClass = "bg-indigo-500 shadow-indigo-500/20";
                        }
                        
                        return (
                          <button
                            key={serv.id || idx}
                            type="button"
                            onClick={() => { action(); playAudio('click'); }}
                            className={\`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer active:scale-95 \${
                              theme === 'dark' 
                                ? 'bg-[#141A28] border-slate-800/60 hover:bg-slate-800/80 shadow-md shadow-slate-900/50' 
                                : 'bg-white border-neutral-100 hover:bg-neutral-50 shadow-sm'
                            }\`}
                          >
                            <div className={\`w-12 h-10 rounded-xl flex items-center justify-center mb-2 shadow-md \${colorClass}\`}>
                              {serv.icon ? (
                                <img src={serv.icon} alt={serv.name} className="w-6 h-6 object-contain" />
                              ) : (
                                <IconComponent className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <span className={\`text-[10px] font-black tracking-tight text-center leading-tight \${
                              theme === 'dark' ? 'text-slate-300' : 'text-neutral-700'
                            }\`}>{serv.name}</span>
                          </button>
                        );
                      });
                    })()}
                  </div>

                  `;
  code = code.substring(0, mainGridStart) + newMainGrid + code.substring(promoBannerStart);
  fs.writeFileSync('src/App.tsx', code);
}
