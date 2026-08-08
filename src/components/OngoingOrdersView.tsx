import React from 'react';
import { Clock, Check, X, FileText, Smartphone, Building, RefreshCw, Layers } from 'lucide-react';
import { Order } from '../types';

interface OngoingOrdersViewProps {
  orders: any[];
  actionLoading: boolean;
  onApprove: (orderId: string) => void;
  onReject: (order: any) => void;
  onViewInvoice: (order: any) => void;
}

export default function OngoingOrdersView({
  orders,
  actionLoading,
  onApprove,
  onReject,
  onViewInvoice
}: OngoingOrdersViewProps) {
  // Filter for PENDING or PROCESSING orders (case-insensitive)
  const ongoingOrders = orders.filter(o => {
    const status = o.status?.toUpperCase() || '';
    return status === 'PENDING' || status === 'PROCESSING';
  });

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-4xs text-left overflow-hidden">
      
      {/* Header Banner */}
      <div className="p-5 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-neutral-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>চলমান অর্ডারসমূহ (Ongoing Orders)</span>
          </h3>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5">
            Real-time pending and processing transactions queue
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center space-x-1.5">
            <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
            <span>{ongoingOrders.length} টি চলমান অর্ডার</span>
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-150 text-[10px] font-black text-neutral-400 uppercase tracking-wider">
              <th className="p-4">অর্ডার আইডি & প্রকার</th>
              <th className="p-4">গ্রাহক তথ্য (User)</th>
              <th className="p-4">সার্ভিস চ্যানেল</th>
              <th className="p-4">প্রাপক অ্যাকাউন্ট (Recipient)</th>
              <th className="p-4">রাউটিং / রেফারেন্স / নোট</th>
              <th className="p-4 text-right">পরিমাণ BDT</th>
              <th className="p-4 text-center">দ্রুত অ্যাকশন (Quick Actions)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-xs font-medium text-neutral-700">
            {ongoingOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-neutral-400 font-extrabold space-y-2">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto border border-neutral-200">
                    <Check className="w-6 h-6" />
                  </div>
                  <p>বর্তমানে কোনো চলমান বা পেন্ডিং অর্ডার নেই।</p>
                </td>
              </tr>
            ) : (
              ongoingOrders.map((ord) => {
                const userName = ord.userName || ord.userEmail?.split('@')[0] || 'গ্রাহক';
                const userPhone = ord.userPhone || 'N/A';
                const targetNumber = ord.recipientNumber || ord.account || 'N/A';
                const holderName = ord.accountName || ord.accountHolder || 'N/A';
                const routingCode = ord.routingNumber || 'N/A';
                const refCode = ord.reference || ord.ref || 'N/A';
                const serviceLabel = ord.type || 'N/A';
                const operatorName = ord.operator || ord.serviceName || 'N/A';

                return (
                  <tr key={ord.id} className="hover:bg-neutral-50/50 transition-colors">
                    
                    {/* ID & Type */}
                    <td className="p-4 space-y-1">
                      <span className="font-mono font-black text-neutral-900">{ord.id}</span>
                      <div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                          ord.type === 'Add Money' ? 'bg-pink-50 text-pink-700 border border-pink-150' :
                          ord.type === 'Drive Pack' ? 'bg-sky-50 text-sky-700 border border-sky-150' :
                          ord.type === 'Bank Transfer' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' :
                          'bg-amber-50 text-amber-700 border border-amber-150'
                        }`}>
                          {ord.type}
                        </span>
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="p-4 space-y-0.5">
                      <p className="font-bold text-neutral-900">{userName}</p>
                      <p className="font-mono text-[10.5px] text-neutral-500 font-bold">{userPhone}</p>
                    </td>

                    {/* Service/Operator */}
                    <td className="p-4 space-y-0.5">
                      <p className="font-bold text-neutral-900">{operatorName}</p>
                      {ord.paymentMethod && <p className="text-[10px] text-neutral-400 font-semibold">{ord.paymentMethod}</p>}
                    </td>

                    {/* Recipient Account Number & Name */}
                    <td className="p-4 space-y-0.5">
                      <p className="font-mono font-bold text-indigo-600 text-sm">{targetNumber}</p>
                      {holderName !== 'N/A' && holderName && (
                        <p className="text-[10.5px] text-neutral-500 font-bold">নাম: {holderName}</p>
                      )}
                    </td>

                    {/* Routing / Reference */}
                    <td className="p-4 space-y-0.5">
                      {routingCode !== 'N/A' && routingCode && (
                        <p className="text-[10.5px] font-bold text-neutral-800">রাউটিং: <span className="font-mono font-bold">{routingCode}</span></p>
                      )}
                      {refCode !== 'N/A' && refCode && (
                        <p className="text-[10.5px] font-bold text-neutral-600">রেফারেন্স: {refCode}</p>
                      )}
                      {(!routingCode || routingCode === 'N/A') && (!refCode || refCode === 'N/A') && (
                        <span className="text-neutral-400 italic">প্রযোজ্য নয়</span>
                      )}
                    </td>

                    {/* Amount BDT */}
                    <td className="p-4 text-right">
                      <p className="text-sm font-black text-neutral-900 font-mono">৳{ord.amount.toLocaleString('bn-BD')}</p>
                      {ord.commissionDeducted !== undefined && ord.commissionDeducted > 0 && (
                        <p className="text-[9.5px] text-emerald-600 font-bold font-mono">কমিশন: ৳{ord.commissionDeducted}</p>
                      )}
                    </td>

                    {/* Quick Action Buttons */}
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        
                        {/* Approve Button */}
                        <button
                          onClick={() => onApprove(ord.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-350 text-emerald-700 font-bold rounded-lg cursor-pointer transition-all active:scale-95 flex items-center space-x-1"
                          title="সফল করুন (Approve)"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-[10.5px]">সফল করুন</span>
                        </button>

                        {/* Reject Button */}
                        <button
                          onClick={() => onReject(ord)}
                          disabled={actionLoading}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-350 text-rose-700 font-bold rounded-lg cursor-pointer transition-all active:scale-95 flex items-center space-x-1"
                          title="বাতিল করুন (Reject)"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span className="text-[10.5px]">বাতিল</span>
                        </button>

                        {/* Invoice Button */}
                        <button
                          onClick={() => onViewInvoice(ord)}
                          className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 font-bold rounded-lg cursor-pointer transition-all active:scale-95 flex items-center space-x-1"
                          title="ইনভয়েস দেখুন (Invoice)"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-[10.5px]">ইনভয়েস</span>
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
