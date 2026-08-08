const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = "printWindow.document.write(`<p><b>Amount BDT:</b> ৳${selectedInvoice.amount}</p>`);";
const replacementStr = "printWindow.document.write(`<p><b>Amount:</b> ৳${selectedInvoice.amount} BDT` + (showForeignCurrency ? ` / ${(selectedInvoice.amount / globalCurrencyRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${globalCurrencyName}` : '') + `</p>`);";

if(code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/App.tsx', code);
}
