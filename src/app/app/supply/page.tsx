'use client';

import Link from 'next/link';
import {
  Server,
  Activity,
  Cpu,
  DollarSign,
  Pause,
  Play,
  Pencil,
  Eye,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { listings, activeRentals } from '@/lib/mock';
import { LiveDot } from '@/components/ui/live-dot';
import { TrustBadge } from '@/components/ui/trust-badge';
import { ListingStatus } from '@/lib/types';

/* ─── Supplier-scoped mock data ─── */

const myListings = listings.slice(0, 5).map((l, i) => ({
  ...l,
  status: (['live', 'live', 'paused', 'rented', 'maintenance'] as ListingStatus[])[i],
  name: [
    'h100-cluster-alpha',
    'a100-node-bravo',
    'b200-pod-charlie',
    'l40s-rack-delta',
    'rtx4090-dev-echo',
  ][i],
  utilization7d: [82, 71, 0, 94, 12][i],
}));

const myActiveRentals = activeRentals.slice(0, 3).map((r, i) => ({
  ...r,
  renterHandle: ['anon-7K2', 'anon-Q9F', 'anon-3XB'][i],
  renterTier: (['verified+', 'verified', 'new'] as const)[i],
  gpuUtil: [87, 64, 92][i],
}));

interface HardwareNode {
  id: string;
  name: string;
  lastHeartbeat: string;
  gpuTemps: number[];
  eccErrors: number;
  ncclResult: 'pass' | 'fail' | 'degraded';
  ncclGbps: number;
}

const hardwareNodes: HardwareNode[] = [
  { id: 'n-001', name: 'h100-cluster-alpha', lastHeartbeat: '12s ago', gpuTemps: [62, 64, 61, 63, 65, 62, 64, 63], eccErrors: 0, ncclResult: 'pass', ncclGbps: 418 },
  { id: 'n-002', name: 'a100-node-bravo', lastHeartbeat: '8s ago', gpuTemps: [58, 57, 59, 56], eccErrors: 0, ncclResult: 'pass', ncclGbps: 276 },
  { id: 'n-003', name: 'b200-pod-charlie', lastHeartbeat: '4s ago', gpuTemps: [71, 73, 69, 74, 72, 70, 68, 75], eccErrors: 2, ncclResult: 'degraded', ncclGbps: 489 },
  { id: 'n-004', name: 'l40s-rack-delta', lastHeartbeat: '6s ago', gpuTemps: [55, 54, 56, 53], eccErrors: 0, ncclResult: 'pass', ncclGbps: 178 },
  { id: 'n-005', name: 'rtx4090-dev-echo', lastHeartbeat: '3m 12s ago', gpuTemps: [82, 85], eccErrors: 7, ncclResult: 'fail', ncclGbps: 0 },
];

/* ─── Helpers ─── */

function formatTimeLeft(endTime: string): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return 'ending';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimeAgo(startTime: string): string {
  const diff = Date.now() - new Date(startTime).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m ago`;
  return `${m}m ago`;
}

const statusConfig: Record<ListingStatus, { label: string; bg: string; text: string; dot?: 'accent' | 'success' | 'warning' | 'danger' }> = {
  live: { label: 'Live', bg: 'bg-[#84CC16]/10', text: 'text-[#84CC16]', dot: 'success' },
  paused: { label: 'Paused', bg: 'bg-[#FACC15]/10', text: 'text-[#FACC15]', dot: 'warning' },
  rented: { label: 'Rented', bg: 'bg-[#38BDF8]/10', text: 'text-[#38BDF8]' },
  maintenance: { label: 'Maint.', bg: 'bg-[#F87171]/10', text: 'text-[#F87171]', dot: 'danger' },
};

/* ─── Components ─── */

function StatCard({ label, value, icon: Icon, mono = false }: { label: string; value: string | number; icon: React.ElementType; mono?: boolean }) {
  return (
    <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4 flex items-start gap-3">
      <div className="p-2 bg-[#18181B] rounded-[6px]">
        <Icon className="w-4 h-4 text-[#71717A]" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-[#71717A]">{label}</span>
        <span className={cn('text-lg text-[#FAFAFA] font-medium', mono && 'font-mono')}>{value}</span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ListingStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-xs font-medium', cfg.bg, cfg.text)}>
      {cfg.dot && <LiveDot color={cfg.dot} className="h-1.5 w-1.5" />}
      {cfg.label}
    </span>
  );
}

function UtilizationBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'bg-[#84CC16]' : pct >= 50 ? 'bg-[#FACC15]' : pct >= 1 ? 'bg-[#F87171]' : 'bg-[#27272A]';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-[#1F1F23] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <span className="font-mono text-xs text-[#A1A1AA] w-8 text-right">{pct}%</span>
    </div>
  );
}

/* ─── Empty State ─── */

function EmptyState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-10 text-center max-w-md space-y-4">
        <div className="mx-auto w-12 h-12 bg-[#18181B] rounded-[10px] flex items-center justify-center">
          <Server className="w-6 h-6 text-[#71717A]" />
        </div>
        <h2 className="text-lg text-[#FAFAFA] font-medium">No nodes listed yet</h2>
        <p className="text-sm text-[#71717A] leading-relaxed">
          Connect your hardware, run diagnostics, and start earning. The onboarding wizard takes about 5 minutes.
        </p>
        <Link
          href="/app/supply/onboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#84CC16] text-black text-sm font-medium rounded-[6px] hover:bg-[#84CC16]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          List your first node
        </Link>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function SupplyDashboardPage() {
  const hasListings = myListings.length > 0;

  const totalListings = myListings.length;
  const activeRentalCount = myActiveRentals.length;
  const utilization7d = 68.4;
  const projectedEarnings = 4218.50;

  if (!hasListings) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#0A0A0B]">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0A0A0B] p-6 space-y-6">
      {/* ─── Top Stat Strip ─── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Listings" value={totalListings} icon={Server} />
        <StatCard label="Active Rentals" value={activeRentalCount} icon={Activity} />
        <StatCard label="7d Utilization" value={`${utilization7d}%`} icon={Cpu} mono />
        <StatCard label="Projected Weekly" value={`$${projectedEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={DollarSign} mono />
      </div>

      {/* ─── Two Column Layout ─── */}
      <div className="grid grid-cols-[1fr_1.4fr] gap-6">
        {/* Left: Active Rentals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#FAFAFA] flex items-center gap-2">
              <LiveDot color="accent" />
              Active Rentals
              <span className="font-mono text-xs text-[#71717A]">({myActiveRentals.length})</span>
            </h2>
          </div>

          <div className="space-y-2">
            {myActiveRentals.map((rental) => (
              <div
                key={rental.id}
                className="bg-[#111113] border border-[#1F1F23] rounded-[10px] p-4 space-y-3 hover:border-[#27272A] transition-colors"
              >
                {/* Renter + Trust */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-[#FAFAFA]">{rental.renterHandle}</span>
                    <TrustBadge tier={rental.renterTier} showLabel={false} />
                  </div>
                  <Link
                    href={`/app/demand/rentals/${rental.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#18181B] hover:bg-[#27272A] text-xs text-[#A1A1AA] rounded-[6px] transition-colors"
                  >
                    View <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Node config */}
                <div className="font-mono text-xs text-[#A1A1AA]">
                  {rental.listing.gpu.count}x {rental.listing.gpu.model}
                </div>

                {/* Timing row */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-[#71717A]">
                    <Clock className="w-3 h-3" />
                    Started {formatTimeAgo(rental.startTime)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#A1A1AA]">
                    Ends in <span className="font-mono text-[#FAFAFA]">{formatTimeLeft(rental.endTime)}</span>
                  </div>
                </div>

                {/* GPU Util */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1F1F23]">
                  <span className="text-xs text-[#71717A]">Avg GPU Util</span>
                  <span className={cn(
                    'font-mono text-sm font-medium',
                    rental.gpuUtil >= 80 ? 'text-[#84CC16]' : rental.gpuUtil >= 50 ? 'text-[#FACC15]' : 'text-[#F87171]'
                  )}>
                    {rental.gpuUtil}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Listings Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#FAFAFA]">Your Listings</h2>
            <Link
              href="/app/supply/onboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#84CC16] text-black text-xs font-medium rounded-[6px] hover:bg-[#84CC16]/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Listing
            </Link>
          </div>

          <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[1.2fr_90px_120px_80px_110px] gap-3 px-4 py-2.5 bg-[#18181B] text-xs text-[#71717A] uppercase tracking-wide border-b border-[#1F1F23]">
              <div>Node</div>
              <div>Status</div>
              <div>7d Util</div>
              <div>$/hr</div>
              <div className="text-right">Actions</div>
            </div>

            {/* Table Rows */}
            {myListings.map((listing) => (
              <div
                key={listing.id}
                className="grid grid-cols-[1.2fr_90px_120px_80px_110px] gap-3 px-4 py-3 items-center border-b border-[#1F1F23] last:border-b-0 hover:bg-[#18181B]/50 transition-colors"
              >
                {/* Node name + config */}
                <div className="min-w-0">
                  <div className="font-mono text-sm text-[#FAFAFA] truncate">{listing.name}</div>
                  <div className="text-xs text-[#71717A] truncate">{listing.gpu.count}x {listing.gpu.model}</div>
                </div>

                {/* Status */}
                <div>
                  <StatusPill status={listing.status} />
                </div>

                {/* 7d Utilization */}
                <UtilizationBar pct={listing.utilization7d} />

                {/* Price */}
                <div className="font-mono text-sm text-[#FAFAFA]">
                  ${listing.pricePerHour.toFixed(2)}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  {listing.status === 'live' ? (
                    <button className="p-1.5 rounded-[6px] hover:bg-[#27272A] text-[#71717A] hover:text-[#FACC15] transition-colors" title="Pause">
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  ) : listing.status === 'paused' ? (
                    <button className="p-1.5 rounded-[6px] hover:bg-[#27272A] text-[#71717A] hover:text-[#84CC16] transition-colors" title="Resume">
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                  <button className="p-1.5 rounded-[6px] hover:bg-[#27272A] text-[#71717A] hover:text-[#A1A1AA] transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    href={`/app/supply/listings/${listing.id}`}
                    className="p-1.5 rounded-[6px] hover:bg-[#27272A] text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Hardware Health Panel ─── */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-[#FAFAFA] flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-[#71717A]" />
          Hardware Health
        </h2>

        <div className="bg-[#111113] border border-[#1F1F23] rounded-[10px] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1.2fr_100px_1fr_80px_140px] gap-3 px-4 py-2.5 bg-[#18181B] text-xs text-[#71717A] uppercase tracking-wide border-b border-[#1F1F23]">
            <div>Node</div>
            <div>Heartbeat</div>
            <div>GPU Temps</div>
            <div>ECC Err</div>
            <div>NCCL Test</div>
          </div>

          {/* Rows */}
          {hardwareNodes.map((node) => {
            const maxTemp = Math.max(...node.gpuTemps);
            const tempWarning = maxTemp >= 80;
            const tempDanger = maxTemp >= 85;
            const eccWarning = node.eccErrors > 0;
            const eccDanger = node.eccErrors >= 5;
            const heartbeatStale = node.lastHeartbeat.includes('m');
            const ncclFail = node.ncclResult === 'fail';
            const ncclDegraded = node.ncclResult === 'degraded';

            return (
              <div
                key={node.id}
                className={cn(
                  'grid grid-cols-[1.2fr_100px_1fr_80px_140px] gap-3 px-4 py-3 items-center border-b border-[#1F1F23] last:border-b-0 transition-colors',
                  (ncclFail || eccDanger || tempDanger) && 'bg-[#F87171]/5',
                  (ncclDegraded || eccWarning || tempWarning) && !ncclFail && !eccDanger && !tempDanger && 'bg-[#FACC15]/5'
                )}
              >
                {/* Node name */}
                <div className="font-mono text-sm text-[#FAFAFA] truncate">{node.name}</div>

                {/* Heartbeat */}
                <div className={cn(
                  'flex items-center gap-1.5 text-xs font-mono',
                  heartbeatStale ? 'text-[#F87171]' : 'text-[#71717A]'
                )}>
                  {heartbeatStale && <AlertTriangle className="w-3 h-3" />}
                  {node.lastHeartbeat}
                </div>

                {/* GPU Temps */}
                <div className="flex items-center gap-1 flex-wrap">
                  {node.gpuTemps.map((temp, i) => (
                    <span
                      key={i}
                      className={cn(
                        'font-mono text-xs px-1.5 py-0.5 rounded',
                        temp >= 85 ? 'bg-[#F87171]/15 text-[#F87171]' :
                        temp >= 75 ? 'bg-[#FACC15]/15 text-[#FACC15]' :
                        'bg-[#18181B] text-[#A1A1AA]'
                      )}
                    >
                      {temp}°
                    </span>
                  ))}
                </div>

                {/* ECC Errors */}
                <div className={cn(
                  'font-mono text-sm',
                  eccDanger ? 'text-[#F87171] font-medium' :
                  eccWarning ? 'text-[#FACC15]' :
                  'text-[#71717A]'
                )}>
                  {node.eccErrors}
                </div>

                {/* NCCL Test */}
                <div className="flex items-center gap-2">
                  {node.ncclResult === 'pass' && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#84CC16]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Pass
                    </span>
                  )}
                  {node.ncclResult === 'degraded' && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#FACC15]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Degraded
                    </span>
                  )}
                  {node.ncclResult === 'fail' && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#F87171] font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Fail
                    </span>
                  )}
                  {node.ncclGbps > 0 && (
                    <span className="font-mono text-xs text-[#71717A]">{node.ncclGbps} GB/s</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
