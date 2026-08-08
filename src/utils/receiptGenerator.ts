export function generateReceiptCanvas(orderData: {
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
}): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 450;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }

    // 1. Sophisticated Warm Cool Neutral Background
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#0F172A'); // Slate 900
    gradient.addColorStop(1, '#1E293B'); // Slate 800
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 450, 600);

    // 2. Draw Decorative Border / Background Accent Circles
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)'; // Indigo
    ctx.lineWidth = 1;
    ctx.strokeRect(15, 15, 420, 570);

    // Dynamic glowing accent background circle
    ctx.beginPath();
    ctx.arc(225, 0, 150, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
    ctx.fill();

    // 3. Draw Brand Name "Shakib Pay"
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillStyle = '#818CF8'; // Indigo 400
    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('SHAKIB PAY', 225, 60);

    ctx.fillStyle = '#94A3B8'; // Slate 400
    ctx.font = '500 11px monospace';
    ctx.fillText('DIGITAL MFS WALLET PLATFORM', 225, 85);

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(40, 110);
    ctx.lineTo(410, 110);
    ctx.stroke();

    // 4. Draw Success Badge / Checkmark Circle
    ctx.beginPath();
    ctx.arc(225, 160, 30, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; // Emerald
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw checkmark symbol inside
    ctx.beginPath();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(213, 160);
    ctx.lineTo(221, 168);
    ctx.lineTo(238, 152);
    ctx.stroke();

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('ORDER PENDING', 225, 210);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '900 36px system-ui, sans-serif';
    ctx.fillText(`৳${orderData.amount.toFixed(2)}`, 225, 250);

    if (orderData.showForeignCurrency && orderData.globalCurrencyRate && orderData.globalCurrencyName) {
      ctx.fillStyle = '#10B981'; // Emerald 500
      ctx.font = '600 13px system-ui, sans-serif';
      const foreignAmt = (orderData.amount / orderData.globalCurrencyRate).toFixed(2);
      ctx.fillText(`${orderData.globalCurrencyName} ${foreignAmt}`, 225, 270);
    }

    // 5. Draw Details Grid
    const details = [
      { label: 'Order ID', value: orderData.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}` },
      { label: 'Service/Type', value: `${orderData.type}` },
      { label: 'Operator/Details', value: orderData.serviceName || 'N/A' },
      { label: 'User Name', value: orderData.userName || 'N/A' },
      { label: 'User Phone', value: orderData.userPhone || 'N/A' },
    ];

    if (orderData.targetNumber) {
      details.push({ label: 'Target Phone/Account', value: orderData.targetNumber });
    } else if (orderData.account) {
      details.push({ label: 'Account / Card No', value: orderData.account });
    }

    if (orderData.trxId) {
      details.push({ label: 'Transaction ID', value: orderData.trxId });
    }

    details.push({ label: 'Date & Time', value: orderData.timestamp });

    let startY = 300;
    const rowHeight = 30;

    details.forEach((item, index) => {
      // Draw light horizontal separator
      if (index > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.beginPath();
        ctx.moveTo(40, startY - 12);
        ctx.lineTo(410, startY - 12);
        ctx.stroke();
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(item.label.toUpperCase(), 45, startY);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '600 12px system-ui, -apple-system, sans-serif';
      ctx.fillText(item.value, 405, startY);

      startY += rowHeight;
    });

    // 6. Draw Footer Branding Notice
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = '500 10px system-ui, sans-serif';
    ctx.fillText('This is a system generated secure receipt.', 225, 545);
    ctx.fillText('Thank you for choosing Shakib Pay!', 225, 560);

    resolve(canvas.toDataURL('image/png'));
  });
}
