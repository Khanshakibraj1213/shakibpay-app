const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const targetStr = `                {/* Rocket Section */}`;
const usdtForm = `
                {/* USDT Section */}
                <div className="p-5 bg-emerald-50/40 border border-emerald-200/60 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-emerald-200/40">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    <p className="text-sm font-extrabold text-emerald-900">USDT (Crypto)</p>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-black text-emerald-850 uppercase">USDT Wallet Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TRC20: TVgJ..."
                      value={adminNums?.usdt?.personal || adminNums?.usdt || ''}
                      onChange={(e) => setAdminNums({
                        ...adminNums,
                        usdt: { ...adminNums.usdt, personal: e.target.value }
                      })}
                      className="p-2.5 border border-emerald-200 rounded-xl text-xs font-bold bg-white text-neutral-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                
                {/* Rocket Section */}`;

if(code.includes(targetStr)) {
    code = code.replace(targetStr, usdtForm);
    fs.writeFileSync('src/components/AdminPanel.tsx', code);
    console.log("AdminPanel USDT form added!");
}
