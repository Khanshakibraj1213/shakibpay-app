const fs = require('fs');
let code = fs.readFileSync('src/components/CallingCardView.tsx', 'utf8');

const targetStr = `  currencyName?: string;
  currencyRate?: number;
  onCurrencyClick?: () => void;`;

if(code.includes(targetStr)) {
    code = code.replace(targetStr, "");
    fs.writeFileSync('src/components/CallingCardView.tsx', code);
    console.log("Fixed calling card view!");
}
