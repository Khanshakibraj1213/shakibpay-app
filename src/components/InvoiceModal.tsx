import React from 'react';
import { X, Printer, ShieldCheck, User, CreditCard, Calendar, Smartphone, Building, Sparkles } from 'lucide-react';
import { Order } from '../types';

interface InvoiceModalProps {
  order: Order & {
    userName?: string;
    userRole?: string;
    recipientNumber?: string;
    accountName?: string;
    bankName?: string;
    routingNumber?: string;
    reference?: string;
    operator?: string;
    packDetails?: string;
    timestamp?: string;
  };
  onClose: () => void;
  showForeignCurrency?: boolean;
  globalCurrencyName?: string;
  globalCurrencyRate?: number;
}

export default function InvoiceModal({ order, onClose, showForeignCurrency, globalCurrencyName, globalCurrencyRate }: InvoiceModalProps) {
  // Get formatted dates
  const dateObj = order.date ? new Date(order.date) : new Date();
  const formattedDate = dateObj.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Derived Values
  const userName = order.userName || order.userEmail?.split('@')[0] || 'গ্রাহক';
  const userPhone = order.userPhone || 'N/A';
  const userRole = order.userRole || 'রিসেলার';
  const targetNumber = order.recipientNumber || order.account || 'N/A';
  const holderName = order.accountName || order.accountHolder || 'N/A';
  const bankName = order.bankName || (order.type === 'Bank Transfer' ? order.serviceName : '') || 'N/A';
  const routing = order.routingNumber || 'N/A';
  const trxId = order.trxId || 'N/A';
  const refCode = order.reference || order.ref || 'N/A';
  const operatorName = order.operator || 'N/A';
  const driveDetails = order.packDetails || (order.type === 'Drive Pack' ? order.serviceName : '') || 'N/A';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice-${order.id}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Noto Sans Bengali';
            margin: 0;
            padding: 10px;
            width: 70mm;
            color: #111;
            font-size: 11px;
            line-height: 1.4;
            background: #fff;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .header {
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 15px;
            font-weight: 900;
            margin: 0;
            letter-spacing: 1px;
          }
          .subtitle {
            font-size: 9px;
            color: #555;
            margin: 2px 0;
          }
          .order-id {
            font-family: monospace;
            font-size: 12px;
            background: #eee;
            padding: 2px 6px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 5px;
          }
          .section-title {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #ddd;
            margin: 10px 0 5px 0;
            padding-bottom: 2px;
            color: #444;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .label { color: #555; }
          .value { text-align: right; font-weight: bold; }
          .total-box {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 8px 0;
            margin: 12px 0;
            font-size: 13px;
          }
          .status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 4px;
            border: 1px solid #000;
          }
          .status-success { background: #e6f4ea; color: #137333; border-color: #34a853; }
          .status-pending { background: #fef7e0; color: #b06000; border-color: #fbbc04; }
          .status-rejected { background: #fce8e6; color: #c5221f; border-color: #ea4335; }
          .footer {
            border-top: 1px dashed #ddd;
            padding-top: 10px;
            margin-top: 15px;
            font-size: 8px;
            color: #666;
          }
          @media print {
            body { width: 100%; margin: 0; padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="text-center header">
          <h1 class="title">SHAKIB PAY</h1>
          <p class="subtitle">টেলিকম ও অটোমেটেড এমএফএস প্লাটফর্ম</p>
          <div class="order-id">ID: ${order.id}</div>
          <div>
            <span class="status ${
              order.status?.toUpperCase() === 'SUCCESS' ? 'status-success' :
              order.status?.toUpperCase() === 'PENDING' ? 'status-pending' : 'status-rejected'
            }">
              ${order.status?.toUpperCase() === 'SUCCESS' ? '✓ APPROVED' :
                order.status?.toUpperCase() === 'PENDING' ? '⌚ PENDING' : '✗ CANCELLED'}
            </span>
          </div>
        </div>

        <div class="section-title">গ্রাহকের পরিচিতি</div>
        <div class="row">
          <span class="label">নাম:</span>
          <span class="value">${userName}</span>
        </div>
        <div class="row">
          <span class="label">মোবাইল:</span>
          <span class="value">${userPhone}</span>
        </div>
        <div class="row">
          <span class="label">রোল/পদবি:</span>
          <span class="value">${userRole}</span>
        </div>

        <div class="section-title">লেনদেন ও প্রাপক বিবরণী</div>
        <div class="row">
          <span class="label">সার্ভিস প্রকার:</span>
          <span class="value">${order.type}</span>
        </div>

        ${order.type === 'Bank Transfer' ? `
          <div class="row">
            <span class="label">ব্যাংক নাম:</span>
            <span class="value">${bankName}</span>
          </div>
          <div class="row">
            <span class="label">হোল্ডার নাম:</span>
            <span class="value">${holderName}</span>
          </div>
          <div class="row">
            <span class="label">অ্যাকাউন্ট নং:</span>
            <span class="value">${targetNumber}</span>
          </div>
          <div class="row">
            <span class="label">রাউটিং নং:</span>
            <span class="value">${routing}</span>
          </div>
        ` : ''}

        ${order.type === 'Drive Pack' ? `
          <div class="row">
            <span class="label">অপারেটর:</span>
            <span class="value">${operatorName}</span>
          </div>
          <div class="row">
            <span class="label">প্যাক বিবরণ:</span>
            <span class="value">${driveDetails}</span>
          </div>
          <div class="row">
            <span class="label">প্রাপক নম্বর:</span>
            <span class="value">${targetNumber}</span>
          </div>
        ` : ''}

        ${order.type === 'Calling Card' ? `
          <div class="row">
            <span class="label">ব্র্যান্ড:</span>
            <span class="value">${order.serviceName}</span>
          </div>
          <div class="row">
            <span class="label">পিন (PIN):</span>
            <span class="value" style="font-family: monospace;">${order.cardPin || 'N/A'}</span>
          </div>
          <div class="row">
            <span class="label">পাসওয়ার্ড:</span>
            <span class="value" style="font-family: monospace;">${order.cardPassword || 'N/A'}</span>
          </div>
        ` : ''}
        ${(order.type !== 'Bank Transfer' && order.type !== 'Drive Pack' && order.type !== 'Calling Card') ? `
          <div class="row">
            <span class="label">প্রাপক অ্যাকাউন্ট:</span>
            <span class="value">${targetNumber}</span>
          </div>
          ${order.serviceName ? `
            <div class="row">
              <span class="label">অপারেটর/চ্যানেল:</span>
              <span class="value">${order.serviceName}</span>
            </div>
          ` : ''}
        ` : ''}

        ${trxId !== 'N/A' && trxId ? `
          <div class="row">
            <span class="label">ট্রানজেকশন ID:</span>
            <span class="value" style="font-family: monospace;">${trxId}</span>
          </div>
        ` : ''}

        ${refCode !== 'N/A' && refCode ? `
          <div class="row">
            <span class="label">রেফারেন্স নং:</span>
            <span class="value">${refCode}</span>
          </div>
        ` : ''}

        <div class="row">
          <span class="label">তারিখ:</span>
          <span class="value">${formattedDate}</span>
        </div>
        <div class="row">
          <span class="label">সময়:</span>
          <span class="value">${formattedTime}</span>
        </div>

        <div class="total-box">
          <div class="row font-bold">
            <span>মোট পরিশোধ</span>
            <div style="text-align: right;">
              <span>৳${order.amount.toLocaleString('bn-BD')} BDT</span>
              ${showForeignCurrency && globalCurrencyRate && globalCurrencyName ? `<br/><span style="font-size: 10px; color: #666;">~ ${(order.amount / globalCurrencyRate).toFixed(2)} ${globalCurrencyName}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="text-center footer">
          <p>ধন্যবাদ, SHAKIB PAY এর সাথে থাকার জন্য।</p>
          <p>⚡ এটি একটি স্বয়ংক্রিয় ডিজিটাল ভাউচার ভেরিফাইড রশিদ ⚡</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
            // Optional: Close print window after printing
            // window.close();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-neutral-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold leading-none">ডিজিটাল ট্রানজেকশন ইনভয়েস</h3>
              <p className="text-[10px] text-neutral-400 font-medium">Shakib Pay Verified Voucher</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-left">
          
          {/* Status Badge Block */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">রশিদ আইডি</span>
              <p className="text-sm font-mono font-black text-neutral-900">{order.id}</p>
            </div>
            <div>
              <span className={`text-xs font-black px-3.5 py-1.5 rounded-full border ${
                order.status?.toUpperCase() === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                order.status?.toUpperCase() === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {order.status?.toUpperCase() === 'SUCCESS' ? '✓ সফল হয়েছে' : 
                 order.status?.toUpperCase() === 'PENDING' ? '⌚ পেন্ডিং রয়েছে' : '✗ বাতিল করা হয়েছে'}
              </span>
            </div>
          </div>

          {/* Grid Layout of Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            {/* Customer Section */}
            <div className="space-y-3.5">
              <h4 className="font-extrabold text-neutral-900 border-b border-neutral-100 pb-1 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-indigo-500" />
                <span>গ্রাহক পরিচিতি (Customer)</span>
              </h4>
              <div className="space-y-2 font-medium">
                <div className="flex justify-between md:justify-start md:space-x-4">
                  <span className="text-neutral-400 min-w-[80px]">ইউজার নাম:</span>
                  <span className="text-neutral-800 font-bold">{userName}</span>
                </div>
                <div className="flex justify-between md:justify-start md:space-x-4">
                  <span className="text-neutral-400 min-w-[80px]">মোবাইল নম্বর:</span>
                  <span className="text-neutral-800 font-bold font-mono">{userPhone}</span>
                </div>
                <div className="flex justify-between md:justify-start md:space-x-4">
                  <span className="text-neutral-400 min-w-[80px]">রোল / পদবি:</span>
                  <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-[10px] font-bold">{userRole}</span>
                </div>
              </div>
            </div>

            {/* Service & Recipient Section */}
            <div className="space-y-3.5">
              <h4 className="font-extrabold text-neutral-900 border-b border-neutral-100 pb-1 flex items-center space-x-1.5">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                <span>সার্ভিস ও প্রাপক (Service Detail)</span>
              </h4>
              <div className="space-y-2 font-medium">
                <div className="flex justify-between md:justify-start md:space-x-4">
                  <span className="text-neutral-400 min-w-[80px]">সার্ভিস ধরন:</span>
                  <span className="text-neutral-800 font-bold">{order.type}</span>
                </div>

                {order.type === 'Bank Transfer' ? (
                  <>
                    <div className="flex justify-between md:justify-start md:space-x-4">
                      <span className="text-neutral-400 min-w-[80px]">ব্যাংক নাম:</span>
                      <span className="text-neutral-800 font-bold">{bankName}</span>
                    </div>
                    <div className="flex justify-between md:justify-start md:space-x-4">
                      <span className="text-neutral-400 min-w-[80px]">হোল্ডার নাম:</span>
                      <span className="text-neutral-800 font-bold">{holderName}</span>
                    </div>
                    <div className="flex justify-between md:justify-start md:space-x-4">
                      <span className="text-neutral-400 min-w-[80px]">রাউটিং নং:</span>
                      <span className="text-neutral-800 font-bold font-mono">{routing}</span>
                    </div>
                  </>
                ) : order.type === 'Drive Pack' ? (
                  <>
                    <div className="flex justify-between md:justify-start md:space-x-4">
                      <span className="text-neutral-400 min-w-[80px]">অপারেটর:</span>
                      <span className="text-neutral-800 font-bold">{operatorName}</span>
                    </div>
                    <div className="flex justify-between md:justify-start md:space-x-4">
                      <span className="text-neutral-400 min-w-[80px]">প্যাক বিবরণ:</span>
                      <span className="text-neutral-800 font-bold leading-normal">{driveDetails}</span>
                    </div>
                  </>
                ) : order.type === 'Calling Card' ? (
                  <>
                    <div className="flex justify-between md:justify-start md:space-x-4">
                      <span className="text-neutral-400 min-w-[80px]">ব্র্যান্ড:</span>
                      <span className="text-neutral-800 font-bold">{order.serviceName}</span>
                    </div>
                    <div className="flex justify-between md:justify-start md:space-x-4">
                      <span className="text-neutral-400 min-w-[80px]">পিন (PIN):</span>
                      <span className="text-indigo-600 font-bold font-mono">{order.cardPin || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between md:justify-start md:space-x-4">
                      <span className="text-neutral-400 min-w-[80px]">পাসওয়ার্ড:</span>
                      <span className="text-indigo-600 font-bold font-mono">{order.cardPassword || 'N/A'}</span>
                    </div>
                    {order.cardExpiry && (
                      <div className="flex justify-between md:justify-start md:space-x-4">
                        <span className="text-neutral-400 min-w-[80px]">মেয়াদ:</span>
                        <span className="text-neutral-800 font-bold">{order.cardExpiry}</span>
                      </div>
                    )}
                  </>
                ) : (
                  order.serviceName && (
                    <div className="flex justify-between md:justify-start md:space-x-4">
                      <span className="text-neutral-400 min-w-[80px]">চ্যানেল:</span>
                      <span className="text-neutral-800 font-bold">{order.serviceName}</span>
                    </div>
                  )
                )}

                <div className="flex justify-between md:justify-start md:space-x-4">
                  <span className="text-neutral-400 min-w-[80px]">প্রাপক নং:</span>
                  <span className="text-indigo-600 font-bold font-mono">{targetNumber}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Additional details (TrxID / Reference / Time) */}
          <div className="bg-neutral-50/70 p-4 rounded-xl border border-neutral-150 space-y-2 text-xs">
            <h4 className="font-bold text-neutral-800 text-[10px] uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              <span>লেনদেন সময় ও অতিরিক্ত উপাত্ত (Metadata)</span>
            </h4>
            
            <div className="grid grid-cols-2 gap-4 font-medium">
              <div>
                <span className="text-neutral-400 block text-[10px]">তারিখ ও সময়</span>
                <span className="text-neutral-800 font-bold">{formattedDate} • {formattedTime}</span>
              </div>
              
              {trxId !== 'N/A' && trxId && (
                <div>
                  <span className="text-neutral-400 block text-[10px]">ট্রানজেকশন ID</span>
                  <span className="text-neutral-800 font-mono font-bold uppercase">{trxId}</span>
                </div>
              )}

              {refCode !== 'N/A' && refCode && (
                <div>
                  <span className="text-neutral-400 block text-[10px]">রেফারেন্স কোড / নোট</span>
                  <span className="text-neutral-800 font-bold">{refCode}</span>
                </div>
              )}

              {order.commissionDeducted !== undefined && order.commissionDeducted > 0 && (
                <div>
                  <span className="text-indigo-500 block text-[10px]">কমিশন বোনাস (+)</span>
                  <span className="text-indigo-600 font-bold">৳{order.commissionDeducted} BDT</span>
                </div>
              )}
            </div>
          </div>

          {/* Large total balance block */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex justify-between items-center shrink-0">
            <div>
              <span className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">মোট পরিশোধের পরিমাণ</span>
              <p className="text-[10px] text-neutral-400 leading-normal">সর্বমোট মূসক সহ বিডিটি টাকা</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-xl font-black text-indigo-600 font-mono">৳{order.amount.toLocaleString('bn-BD')} BDT</span>
              {showForeignCurrency && globalCurrencyRate && globalCurrencyName && (
                <span className="text-xs font-bold text-neutral-500 mt-1">
                  ~ {(order.amount / globalCurrencyRate).toFixed(2)} {globalCurrencyName}
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-150 flex items-center justify-between shrink-0">
          <p className="text-[10px] text-neutral-400 font-medium">
            Verified by PayFly automatic e-Receipt.
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>রশিদ প্রিন্ট করুন</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
