'use client';

import { useMemo } from 'react';
import { SUPPLIER_TIERS, TrustTier } from '@/lib/types';

interface TierPricingChartProps {
  basePrice: number;
  className?: string;
}

/**
 * Shows a pricing dynamics chart for the supplier onboarding wizard.
 * Displays how pricing varies by tier and over a 30-day period.
 */
export function TierPricingChart({ basePrice, className }: TierPricingChartProps) {
  // Generate 30-day price data for each tier
  const chartData = useMemo(() => {
    const tierList: TrustTier[] = ['platinum', 'gold', 'silver', 'bronze'];
    return tierList.map(tier => {
      const multiplier = SUPPLIER_TIERS[tier].pricingMultiplier;
      const effectivePrice = basePrice * multiplier;
      // Simulate daily price fluctuation (demand-based)
      const days = Array.from({ length: 30 }, (_, i) => {
        const demandFactor = 1 + Math.sin(i * 0.3) * 0.08 + (i > 20 ? 0.05 : 0);
        return Math.round(effectivePrice * demandFactor * 100) / 100;
      });
      return { tier, days, avgPrice: effectivePrice };
    });
  }, [basePrice]);

  const allPrices = chartData.flatMap(d => d.days);
  const maxPrice = Math.max(...allPrices);
  const minPrice = Math.min(...allPrices);
  const range = maxPrice - minPrice || 1;

  const chartHeight = 120;
  const chartWidth = 320;
  const padding = { top: 8, bottom: 20, left: 0, right: 0 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const tierColors: Record<TrustTier, string> = {
    platinum: '#E5E4E2',
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
  };

  return (
    <div className={className}>
      <div className="rounded-[10px] border border-[#1F1F23] bg-[#111113] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wide">Pricing by Tier (30-day projection)</h3>
        </div>

        {/* Chart */}
        <div className="relative">
          <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(pct => (
              <line
                key={pct}
                x1={padding.left}
                y1={padding.top + plotHeight * (1 - pct)}
                x2={chartWidth - padding.right}
                y2={padding.top + plotHeight * (1 - pct)}
                stroke="#1F1F23"
                strokeWidth={0.5}
              />
            ))}

            {/* Lines for each tier */}
            {chartData.map(({ tier, days }) => {
              const points = days.map((price, i) => {
                const x = padding.left + (i / 29) * plotWidth;
                const y = padding.top + plotHeight - ((price - minPrice) / range) * plotHeight;
                return `${x},${y}`;
              }).join(' ');

              return (
                <polyline
                  key={tier}
                  points={points}
                  fill="none"
                  stroke={tierColors[tier]}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.8}
                />
              );
            })}

            {/* X-axis labels */}
            <text x={padding.left} y={chartHeight - 2} className="text-[8px] fill-[#71717A] font-mono">Day 1</text>
            <text x={chartWidth - padding.right - 30} y={chartHeight - 2} className="text-[8px] fill-[#71717A] font-mono">Day 30</text>
          </svg>
        </div>

        {/* Legend + Pricing Table */}
        <div className="space-y-2">
          {chartData.map(({ tier, avgPrice }) => {
            const config = SUPPLIER_TIERS[tier];
            return (
              <div key={tier} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 rounded" style={{ backgroundColor: tierColors[tier] }} />
                  <span className="text-xs text-[#A1A1AA]">{config.label}</span>
                  <span className="text-[10px] text-[#71717A]">{config.uptimeSLA} SLA</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#FAFAFA]">${avgPrice.toFixed(2)}/hr</span>
                  <span className="text-[10px] text-[#71717A]">
                    {config.pricingMultiplier > 1 ? `+${Math.round((config.pricingMultiplier - 1) * 100)}%` : `${Math.round((config.pricingMultiplier - 1) * 100)}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-[#1F1F23] space-y-1.5">
          <p className="text-[10px] text-[#71717A] leading-relaxed">
            Higher tiers earn more per hour due to reliability guarantees. Prices fluctuate with market demand.
            Platinum providers earn ~25% more than Silver for the same hardware.
          </p>
          <p className="text-[10px] text-[#71717A] leading-relaxed">
            Your tier is determined by: uptime SLA, completed rentals, response time, and hardware health.
            New providers start at Bronze and can upgrade after meeting tier requirements.
          </p>
        </div>
      </div>
    </div>
  );
}
