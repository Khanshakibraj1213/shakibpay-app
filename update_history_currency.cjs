const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `<span className={\`text-xs font-black font-mono block \${theme === 'dark' ? 'text-cyan-400' : 'text-neutral-900'}\`}>৳{order.amount}</span>`;

const replaceStr = `<span className={\`text-xs font-black font-mono block \${theme === 'dark' ? 'text-cyan-400' : 'text-neutral-900'}\`}>৳{order.amount}</span>
                            {showForeignCurrency && (
                              <span className="text-[8px] font-bold text-emerald-500 font-mono block -mt-0.5 mb-0.5">
                                {globalCurrencyName} {(order.amount / globalCurrencyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/App.tsx', code);
}
