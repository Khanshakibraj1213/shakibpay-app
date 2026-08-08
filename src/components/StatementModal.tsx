import React, { useState, useRef } from 'react';
import { X, Printer, Calendar, Filter, FileText, Download, CheckCircle2, Clock, AlertCircle, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Order, User } from '../types';
import { captureCanvasSafely } from '../utils/canvasHelper';

interface StatementModalProps {
  user: User | null;
  orders: Order[];
  theme: 'light' | 'dark';
  onClose: () => void;
}

export default function StatementModal({ user, orders, theme, onClose }: StatementModalProps) {
  // Date Helpers
  const getTodayStr = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDaysAgoStr = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const getStartOfMonthStr = () => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  };

  // State
  const [startDate, setStartDate] = useState<string>(getDaysAgoStr(30));
  const [endDate, setEndDate] = useState<string>(getTodayStr());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDownloadingImage, setIsDownloadingImage] = useState<boolean>(false);

  const statementRef = useRef<HTMLDivElement>(null);

  // Preset Handlers
  const handlePreset = (preset: 'today' | '7days' | 'thisMonth' | '30days' | 'all') => {
    const today = getTodayStr();
    if (preset === 'today') {
      setStartDate(today);
      setEndDate(today);
    } else if (preset === '7days') {
      setStartDate(getDaysAgoStr(7));
      setEndDate(today);
    } else if (preset === '30days') {
      setStartDate(getDaysAgoStr(30));
      setEndDate(today);
    } else if (preset === 'thisMonth') {
      setStartDate(getStartOfMonthStr());
      setEndDate(today);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate(today);
    }
  };

  // Filter Orders by Date Range and Filters
  const filteredOrders = orders.filter((order) => {
    if (!order.date) return false;
    const orderDateStr = new Date(order.date).toISOString().split('T')[0];
    
    const matchesDate = orderDateStr >= startDate && orderDateStr <= endDate;
    const matchesStatus = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || order.type === typeFilter;

    return matchesDate && matchesStatus && matchesType;
  });

  // Sort by Date Descending
  const sortedOrders = [...filteredOrders].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Stats Calculations
  const totalCount = sortedOrders.length;
  const successCount = sortedOrders.filter((o) => o.status === 'Success' || o.status === 'Approved').length;
  const pendingCount = sortedOrders.filter((o) => o.status === 'Pending').length;
  const rejectedCount = sortedOrders.filter((o) => o.status === 'Rejected' || o.status === 'Cancelled').length;

  const totalIn = sortedOrders
    .filter((o) => (o.type === 'Add Money' || o.type === 'Deposit') && (o.status === 'Success' || o.status === 'Approved'))
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const totalOut = sortedOrders
    .filter((o) => o.type !== 'Add Money' && o.type !== 'Deposit' && (o.status === 'Success' || o.status === 'Approved'))
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  const totalVolume = sortedOrders
    .filter((o) => o.status === 'Success' || o.status === 'Approved')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  // Print Statement Handler (Utilizing printable window invoice logic)
  const handlePrintStatement = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    const formattedStart = new Date(startDate).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedEnd = new Date(endDate).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    const printTime = new Date().toLocaleString('bn-BD');

    const rowsHtml = sortedOrders.map((ord, idx) => {
      const dObj = new Date(ord.date);
      const dStr = dObj.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
      const tStr = dObj.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
      const isAdd = ord.type === 'Add Money' || ord.type === 'Deposit';
      const statusBadge = ord.status === 'Success' || ord.status === 'Approved' ? 'APPROVED' : ord.status === 'Pending' ? 'PENDING' : 'REJECTED';
      const statusClass = ord.status === 'Success' || ord.status === 'Approved' ? 'badge-success' : ord.status === 'Pending' ? 'badge-pending' : 'badge-rejected';

      return `
        <tr>
          <td>${idx + 1}</td>
          <td>
            <div style="font-weight: bold;">${dStr}</div>
            <div style="font-size: 9px; color: #666;">${tStr}</div>
          </td>
          <td>
            <span style="font-family: monospace; font-size: 10px; font-weight: bold;">#${ord.id}</span>
          </td>
          <td>
            <div style="font-weight: bold;">${ord.type}</div>
            <div style="font-size: 9px; color: #555;">${ord.serviceName || 'N/A'}</div>
          </td>
          <td>
            <div style="font-family: monospace; font-size: 10px;">${ord.userPhone || 'N/A'}</div>
            ${ord.trxId ? `<div style="font-size: 9px; color: #4F46E5; font-family: monospace;">TrxID: ${ord.trxId}</div>` : ''}
          </td>
          <td style="text-align: right; font-weight: bold; color: ${isAdd ? '#059669' : '#111827'};">
            ${isAdd ? '+' : '-'}৳${ord.amount.toLocaleString('bn-BD')}
          </td>
          <td style="text-align: center;">
            <span class="badge ${statusClass}">${statusBadge}</span>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transaction-Statement-${startDate}-to-${endDate}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Noto Sans Bengali';
            margin: 0;
            padding: 20px;
            color: #1f2937;
            font-size: 11px;
            line-height: 1.5;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 12px;
            margin-bottom: 15px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 900;
            color: #4f46e5;
            margin: 0;
            letter-spacing: 1px;
          }
          .brand-subtitle {
            font-size: 10px;
            color: #6b7280;
            margin-top: 2px;
            font-weight: 600;
          }
          .doc-title {
            text-align: right;
          }
          .doc-title h2 {
            margin: 0;
            font-size: 14px;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doc-title p {
            margin: 2px 0 0 0;
            font-size: 10px;
            color: #4b5563;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
            background: #f9fafb;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .meta-box h4 {
            margin: 0 0 6px 0;
            font-size: 10px;
            text-transform: uppercase;
            color: #6b7280;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 3px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .meta-row .label { color: #6b7280; }
          .meta-row .value { font-weight: 700; color: #111827; }

          .stats-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 15px;
          }
          .stat-card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 8px;
            text-align: center;
          }
          .stat-card .title { font-size: 9px; color: #6b7280; text-transform: uppercase; font-weight: bold; }
          .stat-card .num { font-size: 13px; font-weight: 900; color: #111827; margin-top: 2px; }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 10px;
          }
          th {
            background: #4f46e5;
            color: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
            padding: 6px 8px;
            text-align: left;
            font-size: 9px;
          }
          td {
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: middle;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: bold;
          }
          .badge-success { background: #d1fae5; color: #065f46; }
          .badge-pending { background: #fef3c7; color: #92400e; }
          .badge-rejected { background: #fee2e2; color: #991b1b; }

          .footer {
            margin-top: 25px;
            padding-top: 10px;
            border-top: 1px dashed #d1d5db;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9px;
            color: #6b7280;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">SHAKIB PAY</h1>
            <div class="brand-subtitle">ডিজিটাল টেলিকম ও ওয়ালেট অটোমেশন প্লাটফর্ম</div>
          </div>
          <div class="doc-title">
            <h2>লেনদেন বিবরণী (STATEMENT)</h2>
            <p>মেয়াদ: ${formattedStart} থেকে ${formattedEnd}</p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <h4>গ্রাহকের তথ্য (CUSTOMER INFO)</h4>
            <div class="meta-row"><span class="label">নাম:</span> <span class="value">${user?.name || 'Customer'}</span></div>
            <div class="meta-row"><span class="label">মোবাইল:</span> <span class="value">${user?.phone || 'N/A'}</span></div>
            <div class="meta-row"><span class="label">রোল/টাইপ:</span> <span class="value">${user?.role || 'User'}</span></div>
            <div class="meta-row"><span class="label">ইমেইল:</span> <span class="value">${user?.email || 'N/A'}</span></div>
          </div>
          <div class="meta-box">
            <h4>হিসাব সারসংক্ষেপ (ACCOUNT SUMMARY)</h4>
            <div class="meta-row"><span class="label">মোট ট্রানজেকশন:</span> <span class="value">${totalCount} টি</span></div>
            <div class="meta-row"><span class="label">মোট ডিপোজিট (+):</span> <span class="value" style="color:#059669;">৳${totalIn.toLocaleString('bn-BD')} BDT</span></div>
            <div class="meta-row"><span class="label">মোট খরচ/পেমেন্ট (-):</span> <span class="value" style="color:#dc2626;">৳${totalOut.toLocaleString('bn-BD')} BDT</span></div>
            <div class="meta-row"><span class="label">প্রিন্ট সময়:</span> <span class="value">${printTime}</span></div>
          </div>
        </div>

        <div class="stats-cards">
          <div class="stat-card">
            <div class="title">মোট লেনদেন</div>
            <div class="num">${totalCount}</div>
          </div>
          <div class="stat-card">
            <div class="title">সফল লেনদেন</div>
            <div class="num" style="color:#059669;">${successCount}</div>
          </div>
          <div class="stat-card">
            <div class="title">পেন্ডিং</div>
            <div class="num" style="color:#d97706;">${pendingCount}</div>
          </div>
          <div class="stat-card">
            <div class="title">বাতিল / রিজেক্ট</div>
            <div class="num" style="color:#dc2626;">${rejectedCount}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px;">#</th>
              <th>তারিখ ও সময়</th>
              <th>অর্ডার আইডি</th>
              <th>সার্ভিস / প্রকার</th>
              <th>প্রাপক / TrxID</th>
              <th style="text-align: right;">পরিমাণ (BDT)</th>
              <th style="text-align: center;">স্ট্যাটাস</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="7" style="text-align:center; padding: 20px; color: #9ca3af;">এই তারিখ সীমার মধ্যে কোনো লেনদেন পাওয়া যায়নি।</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div>
            ⚡ This statement is computer generated by Shakib Pay System. No signature required.
          </div>
          <div>
            Verified Voucher • Shakib Pay Mobile App
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Download Statement Image / PNG
  const handleDownloadImage = async () => {
    if (!statementRef.current) return;
    setIsDownloadingImage(true);
    try {
      const canvas = await captureCanvasSafely(statementRef.current, {
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `Statement_${startDate}_to_${endDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to capture statement image:', err);
    } finally {
      setIsDownloadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-neutral-900 text-white border-neutral-800'
        }`}>
          <div className="flex items-center space-x-3 text-left">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black leading-tight">ট্রানজেকশন স্টেটমেন্ট ও খতিয়ান</h3>
              <p className="text-[10px] sm:text-xs text-neutral-400 font-medium">তারিখ ভিত্তিক লেনদেন বিবরণী জেনারেট ও প্রিন্ট করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-left scrollbar-none">

          {/* Quick Presets & Date Filters Card */}
          <div className={`p-4 rounded-2xl border space-y-4 ${
            theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-neutral-50 border-neutral-200/80'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-neutral-200/30">
              <span className="text-xs font-black flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>তারিখের সমসীমা নির্বাচন করুন</span>
              </span>

              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'today', label: 'আজকে' },
                  { key: '7days', label: 'গত ৭ দিন' },
                  { key: '30days', label: 'গত ৩০ দিন' },
                  { key: 'thisMonth', label: 'এই মাস' },
                  { key: 'all', label: 'সব লেনদেন' }
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handlePreset(p.key as any)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Inputs & Dropdown Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 mb-1">শুরুর তারিখ (From)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-500 ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-neutral-300 text-neutral-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 mb-1">শেষ তারিখ (To)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-500 ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-neutral-300 text-neutral-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 mb-1">সার্ভিস ধরন</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-500 ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-neutral-300 text-neutral-800'
                  }`}
                >
                  <option value="all">সব সার্ভিস</option>
                  <option value="Add Money">ডিপোজিট (Add Money)</option>
                  <option value="Recharge">মোবাইল রিচার্জ</option>
                  <option value="Drive Pack">ড্রাইভ প্যাক</option>
                  <option value="Send Money">সেন্ড মানি</option>
                  <option value="Bank Transfer">ব্যাংক ট্রান্সফার</option>
                  <option value="Utility Bill">ইউটিলিটি বিল</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 mb-1">স্ট্যাটাস</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-500 ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-neutral-300 text-neutral-800'
                  }`}
                >
                  <option value="all">সব স্ট্যাটাস</option>
                  <option value="success">সফল (Success)</option>
                  <option value="pending">পেন্ডিং (Pending)</option>
                  <option value="rejected">বাতিল (Rejected)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statement Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-neutral-200'
            }`}>
              <span className="text-[10px] font-bold text-neutral-400 block uppercase">মোট লেনদেন</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-lg font-black">{totalCount}</span>
                <span className="text-[10px] text-neutral-400">টি</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              theme === 'dark' ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/60 border-emerald-200'
            }`}>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">মোট ডিপোজিট (+)</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">৳{totalIn.toLocaleString('bn-BD')}</span>
            </div>

            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              theme === 'dark' ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50/60 border-rose-200'
            }`}>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase">মোট খরচ (-)</span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">৳{totalOut.toLocaleString('bn-BD')}</span>
            </div>

            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              theme === 'dark' ? 'bg-indigo-950/20 border-indigo-900/40' : 'bg-indigo-50/60 border-indigo-200'
            }`}>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block uppercase">সফল ভলিউম</span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">৳{totalVolume.toLocaleString('bn-BD')}</span>
            </div>
          </div>

          {/* Statement Preview Table Container */}
          <div ref={statementRef} className={`p-4 rounded-2xl border space-y-3 ${
            theme === 'dark' ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-neutral-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-2 border-neutral-200/30">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-500 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>স্টেটমেন্ট প্রিভিউ (Statement Preview)</span>
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                {startDate} - {endDate}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[300px] overflow-y-auto scrollbar-none">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-black ${
                    theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-neutral-200 text-neutral-500'
                  }`}>
                    <th className="py-2 px-2">তারিখ</th>
                    <th className="py-2 px-2">আইডি</th>
                    <th className="py-2 px-2">সার্ভিস</th>
                    <th className="py-2 px-2">প্রাপক / TrxID</th>
                    <th className="py-2 px-2 text-right">পরিমাণ</th>
                    <th className="py-2 px-2 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/60 font-medium">
                  {sortedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-neutral-400 text-xs">
                        নির্বাচিত সময়সীমায় কোনো লেনদেন নেই।
                      </td>
                    </tr>
                  ) : (
                    sortedOrders.map((ord) => {
                      const isAdd = ord.type === 'Add Money' || ord.type === 'Deposit';
                      return (
                        <tr key={ord.id} className={theme === 'dark' ? 'hover:bg-slate-900/50' : 'hover:bg-neutral-50'}>
                          <td className="py-2 px-2 whitespace-nowrap text-[10px]">
                            {new Date(ord.date).toLocaleDateString('bn-BD')}
                          </td>
                          <td className="py-2 px-2 font-mono text-[10px] text-neutral-400">
                            #{ord.id}
                          </td>
                          <td className="py-2 px-2">
                            <span className="font-bold block leading-none">{ord.type}</span>
                            <span className="text-[9px] text-neutral-400">{ord.serviceName}</span>
                          </td>
                          <td className="py-2 px-2 text-[10px]">
                            <span className="font-mono block">{ord.userPhone || 'N/A'}</span>
                            {ord.trxId && <span className="font-mono text-indigo-500 text-[9px] block">Trx: {ord.trxId}</span>}
                          </td>
                          <td className={`py-2 px-2 text-right font-mono font-bold whitespace-nowrap ${
                            isAdd ? 'text-emerald-500' : theme === 'dark' ? 'text-slate-200' : 'text-neutral-900'
                          }`}>
                            {isAdd ? '+' : '-'}৳{ord.amount}
                          </td>
                          <td className="py-2 px-2 text-center whitespace-nowrap">
                            <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              ord.status === 'Success' || ord.status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : ord.status === 'Pending'
                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                                  : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                            }`}>
                              {ord.status === 'Success' || ord.status === 'Approved' ? 'সফল' : ord.status === 'Pending' ? 'পেন্ডিং' : 'বাতিল'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
          theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <p className="text-[10px] text-neutral-400 font-medium">
            সর্বমোট {sortedOrders.length} টি লেনদেনের ফিল্টারকৃত বিবরণী
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadImage}
              disabled={isDownloadingImage || sortedOrders.length === 0}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                  : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Download className="w-4 h-4 text-indigo-500" />
              <span>{isDownloadingImage ? 'ডাউনলোড হচ্ছে...' : 'ছবি ডাউনলোড'}</span>
            </button>

            <button
              onClick={handlePrintStatement}
              disabled={sortedOrders.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট / PDF সেভ করুন</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
