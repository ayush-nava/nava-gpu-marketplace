'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { listings } from '@/lib/mock';
import { ListingStatus } from '@/lib/types';
import { Plus, Pause, Play, Pencil, Eye, Server } from 'lucide-react';

type FilterStatus = 'all' | ListingStatus;

const statusConfig: Record<ListingStatus, { label: string; classes: string }> = {
  live: { label: 'Live', classes: 'bg-success/10 text-success' },
  paused: { label: 'Paused', classes: 'bg-warning/10 text-warning' },
  rented: { label: 'Rented', classes: 'bg-info/10 text-info' },
  maintenance: { label: 'Maintenance', classes: 'bg-danger/10 text-danger' },
};

const regionLabels: Record<string, string> = {
  'na-east': 'NA-East',
  'na-west': 'NA-West',
  'eu': 'EU',
  'apac': 'APAC',
  'in': 'IN',
};

// Simulate 7-day utilization per listing
function getUtilization(index: number): number {
  const seed = (index * 7 + 13) % 100;
  return Math.min(98, Math.max(12, seed + ((index * 3) % 30)));
}

export default function SupplyListingsPage() {
  const [filter, setFilter] = useState<FilterStatus>('all');

  const filtered = filter === 'all'
    ? listings
    : listings.filter(l => l.status === filter);

  const statusCounts: Record<FilterStatus, number> = {
    all: listings.length,
    live: listings.filter(l => l.status === 'live').length,
    paused: listings.filter(l => l.status === 'paused').length,
    rented: listings.filter(l => l.status === 'rented').length,
    maintenance: listings.filter(l => l.status === 'maintenance').length,
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-tertiary" />
          <h1 className="text-xl font-semibold text-primary">Your Listings</h1>
          <span className="font-mono text-xs text-tertiary bg-elevated px-2 py-0.5 rounded">
            {listings.length}
          </span>
        </div>
        <Link
          href="/app/supply/onboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-black text-sm font-medium rounded-md hover:bg-accent-dim transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Hardware
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'live', 'paused', 'rented', 'maintenance'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors capitalize',
              filter === status
                ? 'bg-elevated text-primary'
                : 'text-tertiary hover:text-secondary hover:bg-hover'
            )}
          >
            {status} <span className="font-mono text-xs ml-1">({statusCounts[status]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border-subtle rounded-card overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_90px_80px_140px_100px_120px] gap-4 px-4 py-3 bg-elevated text-xs text-tertiary uppercase tracking-wide border-b border-border-subtle">
          <div>Name</div>
          <div>Status</div>
          <div>Region</div>
          <div>7d Utilization</div>
          <div>Price</div>
          <div className="text-right">Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-tertiary">
            No {filter === 'all' ? '' : filter} listings found
          </div>
        ) : (
          filtered.map((listing, i) => {
            const util = getUtilization(i);
            const utilColor =
              util >= 80 ? 'bg-success' :
              util >= 50 ? 'bg-accent' :
              util >= 30 ? 'bg-warning' :
              'bg-danger';

            return (
              <Link
                key={listing.id}
                href={`/app/supply/listings/${listing.id}`}
                className="grid grid-cols-[1fr_90px_80px_140px_100px_120px] gap-4 px-4 py-3.5 border-b border-border-subtle hover:bg-hover transition-colors group"
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-elevated rounded flex items-center justify-center shrink-0">
                    <span className="font-mono text-xs text-tertiary">{listing.gpu.count}x</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-sm text-primary truncate">
                      {listing.gpu.count}x {listing.gpu.model}
                    </div>
                    <div className="text-xs text-tertiary truncate">
                      {listing.id} · {listing.host.cpu.split(' ').slice(-1)[0]}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center">
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded capitalize',
                    statusConfig[listing.status].classes
                  )}>
                    {statusConfig[listing.status].label}
                  </span>
                </div>

                {/* Region */}
                <div className="flex items-center">
                  <span className="font-mono text-xs text-secondary uppercase">
                    {regionLabels[listing.region] || listing.region}
                  </span>
                </div>

                {/* 7d Utilization */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-elevated rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', utilColor)}
                      style={{ width: `${util}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-secondary w-8 text-right">{util}%</span>
                </div>

                {/* Price */}
                <div className="flex items-center">
                  <span className="font-mono text-sm text-primary">
                    ${listing.pricePerHour.toFixed(2)}
                    <span className="text-tertiary text-xs">/hr</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="p-1.5 rounded hover:bg-elevated text-tertiary hover:text-secondary transition-colors"
                    title={listing.status === 'live' ? 'Pause' : 'Resume'}
                  >
                    {listing.status === 'live' ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="p-1.5 rounded hover:bg-elevated text-tertiary hover:text-secondary transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <span
                    className="p-1.5 rounded text-tertiary group-hover:text-accent transition-colors"
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Summary footer */}
      <div className="flex items-center justify-between text-xs text-tertiary px-1">
        <span>
          {statusCounts.live} live · {statusCounts.rented} rented · {statusCounts.paused} paused
        </span>
        <span className="font-mono">
          Est. monthly: ${(listings.reduce((sum, l) => sum + (l.status === 'live' || l.status === 'rented' ? l.pricePerHour : 0), 0) * 24 * 30).toFixed(0)}
        </span>
      </div>
    </div>
  );
}
