'use client';

import { cn } from '@/lib/utils';

const earningsData = [
  { date: '2026-04-28', listing: '8x H100 SXM5 · NVSwitch', renterTier: 'Platinum', duration: '72h', baseRate: '$3.90/hr', tierPremium: '+15%', totalEarned: '$322.92' },
  { date: '2026-04-25', listing: '4x H100 SXM5 · NVSwitch', renterTier: 'Gold', duration: '48h', baseRate: '$3.90/hr', tierPremium: '+10%', totalEarned: '$205.92' },
  { date: '2026-04-22', listing: '8x H100 SXM5 · NVSwitch', renterTier: 'Platinum', duration: '96h', baseRate: '$3.90/hr', tierPremium: '+15%', totalEarned: '$430.56' },
  { date: '2026-04-18', listing: '4x A100 SXM · NVLink', renterTier: 'Silver', duration: '120h', baseRate: '$2.40/hr', tierPremium: '+5%', totalEarned: '$302.40' },
  { date: '2026-04-14', listing: '8x H100 SXM5 · NVSwitch', renterTier: 'Gold', duration: '36h', baseRate: '$3.90/hr', tierPremium: '+10%', totalEarned: '$154.44' },
  { date: '2026-04-10', listing: '4x A100 SXM · NVLink', renterTier: 'Platinum', duration: '168h', baseRate: '$2.40/hr', tierPremium: '+15%', totalEarned: '$463.68' },
  { date: '2026-04-06', listing: '4x H100 SXM5 · NVSwitch', renterTier: 'Bronze', duration: '24h', baseRate: '$3.90/hr', tierPremium: '+0%', totalEarned: '$93.60' },
  { date: '2026-04-02', listing: '8x H100 SXM5 · NVSwitch', renterTier: 'Gold', duration: '60h', baseRate: '$3.90/hr', tierPremium: '+10%', totalEarned: '$257.40' },
];

const payoutHistory = [
  { date: '2026-04-21', amount: '$1,247.80', status: 'Processing', reference: 'PO-2026-0421' },
  { date: '2026-04-14', amount: '$986.30', status: 'Completed', reference: 'PO-2026-0414' },
  { date: '2026-04-07', amount: '$1,102.50', status: 'Completed', reference: 'PO-2026-0407' },
  { date: '2026-03-31', amount: '$881.90', status: 'Completed', reference: 'PO-2026-0331' },
  { date: '2026-03-24', amount: '$1,034.20', status: 'Completed', reference: 'PO-2026-0324' },
  { date: '2026-03-17', amount: '$947.70', status: 'Completed', reference: 'PO-2026-0317' },
];

export default function SupplyBillingPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0A0A0B] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-[#FAFAFA]">Earnings</h1>
          <p className="text-sm text-[#71717A] mt-1">Current period: Apr 2026</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <p className="text-xs text-[#71717A] uppercase tracking-wide">Total Earnings</p>
          <p className="font-mono text-2xl text-[#84CC16] mt-1">$4,218.50</p>
        </div>
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <p className="text-xs text-[#71717A] uppercase tracking-wide">Pending Payout</p>
          <p className="font-mono text-2xl text-[#FAFAFA] mt-1">$1,247.80</p>
        </div>
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <p className="text-xs text-[#71717A] uppercase tracking-wide">Completed Payouts</p>
          <p className="font-mono text-2xl text-[#FAFAFA] mt-1">$2,970.70</p>
        </div>
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <p className="text-xs text-[#71717A] uppercase tracking-wide">Avg Utilization</p>
          <p className="font-mono text-2xl text-[#FAFAFA] mt-1">68%</p>
        </div>
      </div>

      {/* Earnings Breakdown Table */}
      <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1F1F23]">
          <h2 className="text-sm font-medium text-[#FAFAFA]">Earnings Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#18181B] text-[#71717A] text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Listing</th>
                <th className="text-left px-4 py-2 font-medium">Renter Tier</th>
                <th className="text-right px-4 py-2 font-medium">Duration</th>
                <th className="text-right px-4 py-2 font-medium">Base Rate</th>
                <th className="text-right px-4 py-2 font-medium">Tier Premium</th>
                <th className="text-right px-4 py-2 font-medium">Total Earned</th>
              </tr>
            </thead>
            <tbody>
              {earningsData.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    'border-b border-[#1F1F23] hover:bg-[#18181B] transition-colors',
                    i === earningsData.length - 1 && 'border-b-0'
                  )}
                >
                  <td className="px-4 py-2.5 font-mono text-[#A1A1AA]">{row.date}</td>
                  <td className="px-4 py-2.5 font-mono text-[#FAFAFA]">{row.listing}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-[4px]',
                        row.renterTier === 'Platinum' && 'bg-[#E5E7EB]/10 text-[#E5E7EB]',
                        row.renterTier === 'Gold' && 'bg-[#F59E0B]/10 text-[#F59E0B]',
                        row.renterTier === 'Silver' && 'bg-[#94A3B8]/10 text-[#94A3B8]',
                        row.renterTier === 'Bronze' && 'bg-[#D97706]/10 text-[#D97706]'
                      )}
                    >
                      {row.renterTier}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#A1A1AA] text-right">{row.duration}</td>
                  <td className="px-4 py-2.5 font-mono text-[#A1A1AA] text-right">{row.baseRate}</td>
                  <td className="px-4 py-2.5 font-mono text-right">
                    <span className={row.tierPremium !== '+0%' ? 'text-[#84CC16]' : 'text-[#71717A]'}>
                      {row.tierPremium}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[#FAFAFA] text-right">{row.totalEarned}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#18181B]">
                <td className="px-4 py-2.5 font-mono text-[#71717A]" colSpan={6}>Period Total</td>
                <td className="px-4 py-2.5 font-mono text-[#84CC16] text-right font-medium">$2,230.92</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payout Settings + Payout History */}
      <div className="grid grid-cols-2 gap-4">
        {/* Payout Settings */}
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <h2 className="text-sm font-medium text-[#FAFAFA] mb-4">Payout Settings</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#18181B] border border-[#27272A] rounded-[6px] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 bg-[#27272A] rounded-[4px] flex items-center justify-center">
                  <span className="text-xs font-mono text-[#A1A1AA]">ACH</span>
                </div>
                <div>
                  <p className="text-sm font-mono text-[#FAFAFA]">Bank account ending in 6789</p>
                  <p className="text-xs text-[#71717A]">Chase Business Checking</p>
                </div>
              </div>
              <button className="px-3 py-1.5 bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] text-xs font-medium rounded-[6px] transition-colors">
                Update
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#18181B] border border-[#27272A] rounded-[6px] px-4 py-3">
                <p className="text-xs text-[#71717A]">Payout Schedule</p>
                <p className="text-sm font-mono text-[#FAFAFA] mt-0.5">Weekly</p>
              </div>
              <div className="bg-[#18181B] border border-[#27272A] rounded-[6px] px-4 py-3">
                <p className="text-xs text-[#71717A]">Next Payout</p>
                <p className="text-sm font-mono text-[#FAFAFA] mt-0.5">2026-04-28</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payout History */}
        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4">
          <h2 className="text-sm font-medium text-[#FAFAFA] mb-4">Payout History</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#71717A] text-xs uppercase tracking-wide">
                <th className="text-left pb-2 font-medium">Date</th>
                <th className="text-right pb-2 font-medium">Amount</th>
                <th className="text-right pb-2 font-medium">Status</th>
                <th className="text-right pb-2 font-medium">Reference</th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map((payout, i) => (
                <tr key={i} className="border-t border-[#1F1F23]">
                  <td className="py-2 font-mono text-[#A1A1AA]">{payout.date}</td>
                  <td className="py-2 font-mono text-[#FAFAFA] text-right">{payout.amount}</td>
                  <td className="py-2 text-right">
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-[4px]',
                        payout.status === 'Completed'
                          ? 'bg-[#84CC16]/10 text-[#84CC16]'
                          : 'bg-[#F59E0B]/10 text-[#F59E0B]'
                      )}
                    >
                      {payout.status}
                    </span>
                  </td>
                  <td className="py-2 font-mono text-xs text-[#71717A] text-right">{payout.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
