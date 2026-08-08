const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /generateReceiptCanvas\(\s*\{([\s\S]*?)\}\s*\)/g;
code = code.replace(regex, (match, p1) => {
    // If it already has showForeignCurrency, don't add it again
    if (p1.includes('showForeignCurrency')) return match;
    
    // Append the properties before the closing brace
    return `generateReceiptCanvas({${p1}, showForeignCurrency, globalCurrencyName, globalCurrencyRate })`;
});

fs.writeFileSync('src/App.tsx', code);
