const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = 'serviceName: `${selectedUtility} Bill (${utilityMonth, showForeignCurrency, globalCurrencyName, globalCurrencyRate })`,';
const replaceStr = 'serviceName: `${selectedUtility} Bill (${utilityMonth})`,';

if(code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Fixed 769!");
}
