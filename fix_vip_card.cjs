const fs = require('fs');
let code = fs.readFileSync('src/components/InteractiveVipCard.tsx', 'utf8');

const targetToRemove = `<button 
              onClick={(e) => { e.stopPropagation(); if(onCurrencyClick) onCurrencyClick(); }} 
              className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-900/30 hover:bg-emerald-800/40 px-2 py-0.5 rounded-md border border-emerald-500/30 cursor-pointer active:scale-95 transition-all flex items-center space-x-1 z-20 relative"
            >
              <span>{showForeignCurrency ? currencyName : 'Select Currency'} ▾</span>
              {showForeignCurrency && (
                <span className="ml-1 text-white font-mono">
                  {balanceRevealed ? (user.walletBalance / currencyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '•••'}
                </span>
              )}
            </button>`;

code = code.replace(targetToRemove, "");

const h9Target = `<div className="h-9 flex items-center">
            <span className={\`text-2xl font-black font-mono tracking-tight text-white transition-all duration-300 \${balanceRevealed ? 'block' : 'hidden'}\`}>
              ৳ {user.walletBalance.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}
            </span>
            <span className={\`text-xl font-extrabold tracking-widest text-cyan-300/80 font-mono transition-all duration-300 \${balanceRevealed ? 'hidden' : 'block'}\`}>
              ••••••••
            </span>
          </div>`;

const newH9 = `<div className="flex flex-col items-start mt-1">
            <div className="h-9 flex items-center">
              <span className={\`text-2xl font-black font-mono tracking-tight text-white transition-all duration-300 \${balanceRevealed ? 'block' : 'hidden'}\`}>
                ৳ {user.walletBalance.toLocaleString('bn-BD', { minimumFractionDigits: 2 })}
              </span>
              <span className={\`text-xl font-extrabold tracking-widest text-cyan-300/80 font-mono transition-all duration-300 \${balanceRevealed ? 'hidden' : 'block'}\`}>
                ••••••••
              </span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); if(onCurrencyClick) onCurrencyClick(); }} 
              className="mt-0.5 text-[11px] font-bold text-emerald-400 uppercase bg-emerald-900/30 hover:bg-emerald-800/40 px-2 py-0.5 rounded-md border border-emerald-500/30 cursor-pointer active:scale-95 transition-all flex items-center space-x-1 z-20 relative"
            >
              <span>{showForeignCurrency ? currencyName : 'Select Currency'} ▾</span>
              {showForeignCurrency && (
                <span className="ml-1 text-white font-mono">
                  {balanceRevealed ? (user.walletBalance / currencyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '•••'}
                </span>
              )}
            </button>
          </div>`;

if(code.includes(h9Target)) {
  code = code.replace(h9Target, newH9);
  fs.writeFileSync('src/components/InteractiveVipCard.tsx', code);
} else {
  console.log("h9Target not found in InteractiveVipCard");
}
