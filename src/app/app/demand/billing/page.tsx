'use client';

import { cn } from '@/lib/utils';

const usageData = [
  { date: '2026-04-28', listing: '4x H100 SXM5 · NVSwitch', duration: '48h', gpuCost: '$187.20', deployFee: '$12.00', total: '$199.20' },
  { date: '2026-04-25', listing: '2x A100 SXM · NVLink', duration: '72h', gpuCost: '$158.40', deployFee: '$8.00', total: '$166.40' },
  { date: '2026-04-22', listing: '8x H100 SXM5 · NVSwitch', duration: '12h', gpuCost: '$134.40', deployFee: '$15.00', total: '$149.40' },
  { date: '2026-04-19', listing: '1x RTX 4090 · PCIe', duration: '96h', gpuCost: '$76.80', deployFee: '$4.00', total: '$80.80' },
  { date: '2026-04-15', listing: '4x A100 PCIe · NVLink', duration: '36h', gpuCost: '$86.40', deployFee: '$8.00', total: '$94.40' },
  { date: '2026-04-11', listing: '2x L40S · PCIe', duration: '24h', gpuCost: '$43.20', deployFee: '$6.00', total: '$49.20' },
  { date: '2026-04-07', listing: '1x H100 PCIe · PCIe', duration: '18h', gpuCost: '$50.40', deployFee: '$4.00', total: '$54.40' },
  { date: '2026-04-03', listing: '4x H100 SXM5 · NVSwitch', duration: '6h', gpuCost: '$23.40', deployFee: '$12.00', total: '$35.40' },
];

const invoiceHistory = [
  { month: 'Apr 2026', amount: '$847.23', status: 'Pending' },
  { month: 'Mar 2026', amount: '$1,204.80', status: 'Paid' },
  { month: 'Feb 2026', amount: '$932.15', status: 'Paid' },
  { month: 'Jan 2026', amount: '$678.90', status: 'Paid' },
  { month: 'Dec 2025', amount: '$1,456.32', status: 'Paid' },
  { month: 'Nov 2025', amount: '$891.44', status: 'Paid' },
];

export default function DemandBillingPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0A0A0B] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#FAFAFA]">Billing</h1>
          <p className="text-sm text-[#71717A] mt-1">Current period: Apr 2026</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <p className="text-xs text-[#71717A] uppercase tracking-wide">Total Spend</p>
          <p className="font-mono text-2xl text-[#FAFAFA] mt-1">$847.23</p>
        </div>
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <p className="text-xs text-[#71717A] uppercase tracking-wide">Active Rentals</p>
          <p className="font-mono text-2xl text-[#FAFAFA] mt-1">3</p>
        </div>
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <p className="text-xs text-[#71717A] uppercase tracking-wide">Compute Hours</p>
          <p className="font-mono text-2xl text-[#FAFAFA] mt-1">312h</p>
        </div>
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <p className="text-xs text-[#71717A] uppercase tracking-wide">Avg Cost/hr</p>
          <p className="font-mono text-2xl text-[#FAFAFA] mt-1">$2.72</p>
        </div>
      </div>

      {/* Usage Breakdown Table */}
      <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1F1F23]">
          <h2 className="text-sm font-medium text-[#FAFAFA]">Usage Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#18181B] text-[#71717A] text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Listing</th>
                <th className="text-right px-4 py-2 font-medium">Duration</th>
                <th className="text-right px-4 py-2 font-medium">GPU Cost</th>
                <th className="text-right px-4 py-2 font-medium">Deploy Fee</th>
                <th className="text-right px-4 py-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {usageData.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    'border-b border-[#1F1F23] hover:bg-[#18181B] transition-colors',
                    i === usageData.length - 1 && 'border-b-0'
                  )}
                >
                  <td className="px-4 py-2.5 font-mono text-[#A1A1AA]">{row.date}</td>
                  <td className="px-4 py-2.5 font-mono text-[#FAFAFA]">{row.listing}</td>
                  <td className="px-4 py-2.5 font-mono text-[#A1A1AA] text-right">{row.duration}</td>
                  <td className="px-4 py-2.5 font-mono text-[#A1A1AA] text-right">{row.gpuCost}</td>
                  <td className="px-4 py-2.5 font-mono text-[#A1A1AA] text-right">{row.deployFee}</td>
                  <td className="px-4 py-2.5 font-mono text-[#FAFAFA] text-right">{row.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#18181B]">
                <td className="px-4 py-2.5 font-mono text-[#71717A]" colSpan={3}>Subtotals</td>
                <td className="px-4 py-2.5 font-mono text-[#FAFAFA] text-right">$760.20</td>
                <td className="px-4 py-2.5 font-mono text-[#FAFAFA] text-right">$69.00</td>
                <td className="px-4 py-2.5 font-mono text-[#FAFAFA] text-right font-medium">$829.20</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Method + Invoice History */}
      <div className="grid grid-cols-2 gap-4">
        {/* Payment Method */}
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <h2 className="text-sm font-medium text-[#FAFAFA] mb-4">Payment Method</h2>
          <div className="flex items-center justify-between bg-[#18181B] border border-[#27272A] rounded-[6px] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 bg-[#27272A] rounded-[4px] flex items-center justify-center">
                <span className="text-xs font-mono text-[#A1A1AA]">VISA</span>
              </div>
              <div>
                <p className="text-sm font-mono text-[#FAFAFA]">Visa ending in 4242</p>
                <p className="text-xs text-[#71717A]">Expires 08/2028</p>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] text-xs font-medium rounded-[6px] transition-colors">
              Update
            </button>
          </div>
        </div>

        {/* Invoice History */}
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <h2 className="text-sm font-medium text-[#FAFAFA] mb-4">Invoice History</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#71717A] text-xs uppercase tracking-wide">
                <th className="text-left pb-2 font-medium">Month</th>
                <th className="text-right pb-2 font-medium">Amount</th>
                <th className="text-right pb-2 font-medium">Status</th>
                <th className="text-right pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {invoiceHistory.map((inv, i) => (
                <tr key={i} className="border-t border-[#1F1F23]">
                  <td className="py-2 text-[#A1A1AA]">{inv.month}</td>
                  <td className="py-2 font-mono text-[#FAFAFA] text-right">{inv.amount}</td>
                  <td className="py-2 text-right">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-[4px]',
                        inv.status === 'Paid'
                          ? 'bg-[#84CC16]/10 text-[#84CC16]'
                          : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                      )}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <button className="text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
