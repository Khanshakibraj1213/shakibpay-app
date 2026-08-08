const fs = require('fs');
let code = fs.readFileSync('src/components/MfsGateway.tsx', 'utf8');

const targetStr = `              {/* Bank card */}`;
const usdtCard = `
              {/* USDT card */}
              <div
                onClick={() => handleCopy(adminNums.usdt, 'usdt')}
                className={\`border rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all hover:scale-[1.01] active:scale-98 \${
                  theme === 'dark'
                    ? 'bg-slate-900 border-slate-800 hover:border-pink-500/50'
                    : 'bg-white border-neutral-200/80 shadow-2xs hover:border-pink-300'
                } \${selectedService === 'USDT' ? 'border-[#ec008c] ring-1 ring-[#ec008c]/40' : ''}\`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-emerald-600">USDT:</span>
                  <span className={\`text-sm font-black font-mono tracking-wider \${theme === 'dark' ? 'text-white' : 'text-neutral-800'} truncate w-40\`}>
                    {adminNums.usdt}
                  </span>
                </div>
                {copiedType === 'usdt' ? (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1 shrink-0">
                    <Check className="w-3 h-3" />
                    <span>কপি হয়েছে</span>
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                )}
              </div>
              
              {/* Bank card */}`;

if(code.includes(targetStr)) {
    code = code.replace(targetStr, usdtCard);
    fs.writeFileSync('src/components/MfsGateway.tsx', code);
    console.log("USDT Card added!");
}
