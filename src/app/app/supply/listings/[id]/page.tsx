'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { listings } from '@/lib/mock';
import { ArrowLeft, Pencil, Star, DollarSign, Activity, Users, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Generate 30 days of fake utilization data — deterministic
function generateUtilizationData() {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const base = 55 + Math.sin(i * 0.4) * 15;
    // Deterministic noise based on index
    const noise = ((i * 7 + 13) % 20) - 10;
    const utilization = Math.min(90, Math.max(40, Math.round(base + noise)));
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Use fixed base date
    const dayOfMonth = ((30 - i) % 28) + 1;
    data.push({
      date: `${monthNames[3]} ${dayOfMonth}`,
      utilization,
    });
  }
  return data;
}

// Generate fake recent rentals — deterministic
function generateRecentRentals(listingId: string) {
  const tenants = ['ml-lab-42', 'deepseek-ops', 'anon-7f3a', 'research-9x', 'inference-co'];
  const durations = ['6h', '24h', '3d', '7d', '12h'];
  const statuses = ['completed', 'active', 'completed', 'completed', 'completed'] as const;
  const revenues = [18.60, 72.00, 244.80, 554.40, 42.00];
  const ratings = ['4.8', '4.6', '4.9', null, null];
  const dates = ['Apr 27', 'Apr 24', 'Apr 21', 'Apr 18', 'Apr 15'];

  return tenants.map((tenant, i) => ({
    id: `rnt-${listingId}-${String(i + 1).padStart(3, '0')}`,
    tenant,
    startDate: dates[i],
    duration: durations[i],
    revenue: revenues[i],
    status: statuses[i],
    rating: ratings[i],
  }));
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const listing = listings.find(l => l.id === id);

  if (!listing) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-center space-y-4">
          <div className="font-mono text-tertiary">Listing not found</div>
          <Link href="/app/supply/listings" className="text-accent hover:underline">
            Back to listings
          </Link>
        </div>
      </div>
    );
  }

  const utilizationData = generateUtilizationData();
  const recentRentals = generateRecentRentals(listing.id);
  const avgUtilization = Math.round(
    utilizationData.reduce((sum, d) => sum + d.utilization, 0) / utilizationData.length
  );
  const totalRevenue = recentRentals.reduce((sum, r) => sum + r.revenue, 0);
  const avgRating =
    recentRentals.filter(r => r.rating).reduce((sum, r) => sum + parseFloat(r.rating!), 0) /
    recentRentals.filter(r => r.rating).length;

  const projectedMonthly = listing.pricePerHour * 24 * 30 * (avgUtilization / 100);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
      {/* Back link */}
      <Link
        href="/app/supply/listings"
        className="inline-flex items-center gap-1.5 text-sm text-tertiary hover:text-secondary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to listings
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-primary tracking-tight">
            {listing.gpu.count}x {listing.gpu.model}
          </h1>
          <div className="flex items-center gap-3 text-sm text-tertiary">
            <span className="font-mono">{listing.id}</span>
            <span>·</span>
            <span className="uppercase">{listing.region}</span>
            <span>·</span>
            <span className="font-mono">${listing.pricePerHour.toFixed(2)}/hr</span>
          </div>
        </div>
        <div className={cn(
          'px-2.5 py-1 text-xs rounded capitalize',
          listing.status === 'live' && 'bg-success/10 text-success',
          listing.status === 'paused' && 'bg-warning/10 text-warning',
          listing.status === 'rented' && 'bg-info/10 text-info',
          listing.status === 'maintenance' && 'bg-danger/10 text-danger',
        )}>
          {listing.status}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-surface border border-border-subtle rounded-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-accent" />
            <span className="text-xs text-tertiary uppercase tracking-wide">Total Revenue</span>
          </div>
          <div className="font-mono text-xl text-primary">${totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-tertiary mt-1">last 30 days</div>
        </div>
        <div className="bg-surface border border-border-subtle rounded-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-accent" />
            <span className="text-xs text-tertiary uppercase tracking-wide">Avg Utilization</span>
          </div>
          <div className="font-mono text-xl text-primary">{avgUtilization}%</div>
          <div className="text-xs text-tertiary mt-1">30-day average</div>
        </div>
        <div className="bg-surface border border-border-subtle rounded-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-xs text-tertiary uppercase tracking-wide">Total Rentals</span>
          </div>
          <div className="font-mono text-xl text-primary">{recentRentals.length}</div>
          <div className="text-xs text-tertiary mt-1">recent period</div>
        </div>
        <div className="bg-surface border border-border-subtle rounded-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-accent" />
            <span className="text-xs text-tertiary uppercase tracking-wide">Avg Rating</span>
          </div>
          <div className="font-mono text-xl text-primary">{avgRating.toFixed(1)}</div>
          <div className="text-xs text-tertiary mt-1">from {recentRentals.filter(r => r.rating).length} reviews</div>
        </div>
      </div>

      {/* Utilization Chart */}
      <div className="bg-surface border border-border-subtle rounded-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-tertiary uppercase tracking-wide">
            30-Day Utilization
          </h2>
          <span className="font-mono text-xs text-secondary">{avgUtilization}% avg</span>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={utilizationData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#84CC16" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#84CC16" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717A', fontSize: 11, fontFamily: 'monospace' }}
                interval={4}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#71717A', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181B',
                  border: '1px solid #27272A',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
                labelStyle={{ color: '#A1A1AA' }}
                itemStyle={{ color: '#84CC16' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`${value}%`, 'Utilization']}
              />
              <Area
                type="monotone"
                dataKey="utilization"
                stroke="#84CC16"
                strokeWidth={1.5}
                fill="url(#utilGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Earnings Projection */}
      <div className="bg-surface border border-border-subtle rounded-card p-6">
        <h2 className="text-sm font-medium text-tertiary uppercase tracking-wide mb-4">
          Earnings Projection
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs text-tertiary">Projected Monthly</span>
            </div>
            <div className="font-mono text-lg text-primary">${projectedMonthly.toFixed(0)}</div>
            <div className="text-xs text-tertiary">at {avgUtilization}% utilization</div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-tertiary">If 80% utilized</span>
            <div className="font-mono text-lg text-secondary">
              ${(listing.pricePerHour * 24 * 30 * 0.8).toFixed(0)}
            </div>
            <div className="text-xs text-tertiary">
              {avgUtilization < 80 ? '+' : ''}
              {((0.8 - avgUtilization / 100) * 100).toFixed(0)}% vs current
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-tertiary">Max potential</span>
            <div className="font-mono text-lg text-secondary">
              ${(listing.pricePerHour * 24 * 30).toFixed(0)}
            </div>
            <div className="text-xs text-tertiary">100% utilization</div>
          </div>
        </div>
      </div>

      {/* Recent Rentals */}
      <div className="bg-surface border border-border-subtle rounded-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h2 className="text-sm font-medium text-tertiary uppercase tracking-wide">
            Recent Rentals
          </h2>
        </div>
        <div className="grid grid-cols-[1fr_100px_80px_100px_80px_60px] gap-4 px-6 py-2.5 bg-elevated text-xs text-tertiary uppercase tracking-wide border-b border-border-subtle">
          <div>Tenant</div>
          <div>Started</div>
          <div>Duration</div>
          <div>Revenue</div>
          <div>Status</div>
          <div>Rating</div>
        </div>
        {recentRentals.map((rental) => (
          <div
            key={rental.id}
            className="grid grid-cols-[1fr_100px_80px_100px_80px_60px] gap-4 px-6 py-3 border-b border-border-subtle hover:bg-hover transition-colors"
          >
            <div className="flex items-center">
              <span className="font-mono text-sm text-primary">{rental.tenant}</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-xs text-secondary">{rental.startDate}</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-xs text-secondary">{rental.duration}</span>
            </div>
            <div className="flex items-center">
              <span className="font-mono text-sm text-primary">${rental.revenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center">
              <span className={cn(
                'px-2 py-0.5 text-xs rounded capitalize',
                rental.status === 'active' && 'bg-success/10 text-success',
                rental.status === 'completed' && 'bg-elevated text-tertiary',
              )}>
                {rental.status}
              </span>
            </div>
            <div className="flex items-center">
              {rental.rating ? (
                <span className="font-mono text-xs text-accent">{rental.rating} ★</span>
              ) : (
                <span className="text-xs text-tertiary">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit button */}
      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-black text-sm font-medium rounded-md hover:bg-accent-dim transition-colors">
          <Pencil className="w-4 h-4" />
          Edit Listing
        </button>
      </div>
    </div>
  );
}
