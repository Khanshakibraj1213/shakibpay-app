const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                    currencyName={globalCurrencyName}
                    currencyRate={globalCurrencyRate}
                      onCurrencyClick={() => setIsCurrencyModalOpen(true)}
                    showForeignCurrency={showForeignCurrency}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, "");
  fs.writeFileSync('src/App.tsx', code);
}
