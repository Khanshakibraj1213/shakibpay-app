const fs = require('fs');
let code = fs.readFileSync('src/utils/receiptGenerator.ts', 'utf8');

const targetFunctionSig = `export function generateReceiptCanvas(orderData: {
  id?: string;
  type: string;
  userName: string;
  userPhone: string;
  serviceName: string;
  amount: number;
  timestamp: string;
  operatorName?: string;
  targetNumber?: string;
  trxId?: string;
  account?: string;
}): Promise<string> {`;

const newFunctionSig = `export function generateReceiptCanvas(orderData: {
  id?: string;
  type: string;
  userName: string;
  userPhone: string;
  serviceName: string;
  amount: number;
  timestamp: string;
  operatorName?: string;
  targetNumber?: string;
  trxId?: string;
  account?: string;
  showForeignCurrency?: boolean;
  globalCurrencyName?: string;
  globalCurrencyRate?: number;
}): Promise<string> {`;

code = code.replace(targetFunctionSig, newFunctionSig);

const targetDraw = "ctx.fillText(`৳${orderData.amount.toFixed(2)}`, 225, 250);";

const newDraw = `ctx.fillText(\`৳\${orderData.amount.toFixed(2)}\`, 225, 250);

    if (orderData.showForeignCurrency && orderData.globalCurrencyRate && orderData.globalCurrencyName) {
      ctx.fillStyle = '#10B981'; // Emerald 500
      ctx.font = '600 13px system-ui, sans-serif';
      const foreignAmt = (orderData.amount / orderData.globalCurrencyRate).toFixed(2);
      ctx.fillText(\`\${orderData.globalCurrencyName} \${foreignAmt}\`, 225, 270);
    }`;

code = code.replace(targetDraw, newDraw);
fs.writeFileSync('src/utils/receiptGenerator.ts', code);
