const fs = require('fs');
let code = fs.readFileSync('src/components/InteractiveVipCard.tsx', 'utf8');

const replaceTarget = `<div className="flex items-center space-x-1.5 text-slate-300">
              <span className="text-[10px] font-bold tracking-wider uppercase">Wallet Balance</span>
              <div className="p-1 rounded-full hover:bg-white/10 transition-colors shrink-0">
                {balanceRevealed ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
              </div>
            </div>
            {showForeignCurrency && (
              <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-900/30 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {currencyName} {balanceRevealed ? (user.walletBalance / currencyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '•••'}
              </span>
            )}`;

const replaceWith = `<div className="flex items-center space-x-1.5 text-slate-300">
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
            </button>`;

code = code.replace(replaceTarget, replaceWith);

fs.writeFileSync('src/components/InteractiveVipCard.tsx', code);
