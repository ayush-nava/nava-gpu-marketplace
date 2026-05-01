'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { rentals } from '@/lib/mock';
import { RentalStatus } from '@/lib/types';
import { LiveDot } from '@/components/ui/live-dot';

type FilterStatus = 'all' | RentalStatus;

function formatDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.round(diff / 3600000);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

function formatTimeUntil(date: string): string {
  const diff = new Date(date).getTime() - Date.now();
  if (diff <= 0) return 'now';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.round(hours / 24)}d`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function RentalsPage() {
  const [filter, setFilter] = useState<FilterStatus>('all');

  const filteredRentals = filter === 'all' 
    ? rentals 
    : rentals.filter(r => r.status === filter);

  const statusCounts: Record<string, number> = {
    all: rentals.length,
    active: rentals.filter(r => r.status === 'active').length,
    scheduled: rentals.filter(r => r.status === 'scheduled').length,
    completed: rentals.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-primary">Rentals</h1>
        <Link
          href="/app/demand"
          className="px-4 py-2 bg-accent text-black text-sm font-medium rounded-md hover:bg-accent-dim transition-colors"
        >
          Browse GPUs
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'scheduled', 'completed'] as FilterStatus[]).map((status) => (
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
        <div className="grid grid-cols-[1fr_140px_100px_100px_100px_80px] gap-4 px-4 py-3 bg-elevated text-xs text-tertiary uppercase tracking-wide border-b border-border-subtle">
          <div>Node</div>
          <div>Started</div>
          <div>Duration</div>
          <div>Status</div>
          <div>Cost</div>
          <div></div>
        </div>

        {filteredRentals.length === 0 ? (
          <div className="px-4 py-12 text-center text-tertiary">
            No {filter === 'all' ? '' : filter} rentals found
          </div>
        ) : (
          filteredRentals.map((rental) => {
            const isActive = rental.status === 'active';
            const isScheduled = rental.status === 'scheduled';

            return (
              <div
                key={rental.id}
                className="grid grid-cols-[1fr_140px_100px_100px_100px_80px] gap-4 px-4 py-4 border-b border-border-subtle hover:bg-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isActive && <LiveDot color="success" />}
                  <div>
                    <div className="font-mono text-sm text-primary">
                      {rental.listing.gpu.count}x {rental.listing.gpu.model}
                    </div>
                    <div className="text-xs text-tertiary uppercase">{rental.listing.region}</div>
                  </div>
                </div>

                <div className="flex items-center">
                  <span className="font-mono text-sm text-secondary">
                    {isScheduled 
                      ? `in ${formatTimeUntil(rental.startTime)}`
                      : new Date(rental.startTime).toLocaleDateString()
                    }
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-mono text-sm text-secondary">
                    {formatDuration(rental.startTime, rental.endTime)}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded capitalize',
                    rental.status === 'active' && 'bg-success/10 text-success',
                    rental.status === 'scheduled' && 'bg-info/10 text-info',
                    rental.status === 'completed' && 'bg-elevated text-tertiary',
                    rental.status === 'cancelled' && 'bg-danger/10 text-danger',
                  )}>
                    {rental.status}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="font-mono text-sm text-primary">
                    ${rental.totalCost.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    href={`/app/demand/rentals/${rental.id}`}
                    className={cn(
                      'px-3 py-1 text-xs rounded transition-colors',
                      isActive
                        ? 'bg-accent text-black hover:bg-accent-dim'
                        : 'bg-elevated text-secondary hover:bg-hover'
                    )}
                  >
                    {isActive ? 'View' : 'Details'}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
