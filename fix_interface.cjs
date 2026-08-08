const fs = require('fs');
let code = fs.readFileSync('src/components/CallingCardView.tsx', 'utf8');

const targetStr = 'showForeignCurrency?: boolean;';
const replaceStr = `showForeignCurrency?: boolean;
  globalCurrencyName?: string;
  globalCurrencyRate?: number;`;

if(code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/CallingCardView.tsx', code);
    console.log("Fixed!");
}
