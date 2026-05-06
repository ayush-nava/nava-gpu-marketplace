'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3X3, List, X, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listings } from '@/lib/mock';
import { AI_MODELS } from '@/lib/mock/models';
import { FilterState, Listing, GPUModel, Interconnect, Region } from '@/lib/types';
import { LiveDot } from '@/components/ui/live-dot';
import { SupplierTierBadge } from '@/components/supplier-tier-badge';
import { TopologyDiagram } from '@/components/topology-diagram';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const gpuModelOptions: GPUModel[] = ['H100 SXM5', 'H100 PCIe', 'A100 SXM', 'A100 PCIe', 'B200', 'L40S', 'RTX 4090', 'RTX 6000 Ada'];
const gpuCountOptions = [1, 2, 4, 8];
const interconnectOptions: { value: Interconnect; label: string }[] = [
  { value: 'nvswitch', label: 'NVSwitch' },
  { value: 'nvswitch-nvlink5', label: 'NVSwitch (NVLink 5)' },
  { value: 'nvlink-bridge', label: 'NVLink Bridge' },
  { value: 'pcie', label: 'PCIe' },
];
const regionOptions: { value: Region; label: string }[] = [
  { value: 'na-east', label: 'NA-East' },
  { value: 'na-west', label: 'NA-West' },
  { value: 'eu', label: 'EU' },
  { value: 'apac', label: 'APAC' },
  { value: 'in', label: 'India' },
];

function ListingCard({ listing, onPin, isPinned }: { listing: Listing; onPin: () => void; isPinned: boolean }) {
  const isAvailableNow = new Date(listing.availability.nextAvailable) <= new Date();

  return (
    <Link
      href={`/app/demand/listing/${listing.id}`}
      className="group relative bg-surface border border-border-subtle hover:border-border-default rounded-card p-4 transition-all duration-150 hover:-translate-y-0.5 block"
    >
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPin(); }}
        className={cn(
          'absolute top-3 right-3 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10',
          isPinned ? 'opacity-100 bg-accent/20 text-accent' : 'hover:bg-hover text-tertiary'
        )}
      >
        <Pin className="w-3.5 h-3.5" />
      </button>

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="font-mono text-sm text-primary font-medium">
              {listing.gpu.count}x {listing.gpu.model}
              {listing.interconnect !== 'pcie' && (
                <span className="text-tertiary"> · {listing.interconnectLabel}</span>
              )}
            </div>
          </div>
        </div>

        {/* Mini Topology */}
        <div className="flex justify-center py-1">
          <TopologyDiagram
            gpuCount={listing.gpu.count}
            interconnect={listing.interconnect}
            compact
            showLabels={false}
          />
        </div>

        {/* Specs */}
        <div className="font-mono text-xs text-secondary leading-relaxed">
          {listing.host.cpu} · {listing.host.ramGB} GB · {listing.host.nvmeGB / 1000} TB NVMe · {listing.host.netGbps} GbE
        </div>

        {/* Region + Availability */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-elevated rounded text-xs font-mono text-tertiary uppercase">
            {listing.region}
          </span>
          <div className="flex items-center gap-1.5">
            {isAvailableNow ? (
              <>
                <LiveDot color="success" />
                <span className="text-xs text-success">Available now</span>
              </>
            ) : (
              <span className="text-xs text-tertiary">
                Available in {Math.ceil((new Date(listing.availability.nextAvailable).getTime() - Date.now()) / 3600000)}h
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
          <span className="font-mono text-base text-primary font-medium">
            ${listing.pricePerHour.toFixed(2)}<span className="text-tertiary text-sm">/hr</span>
          </span>
          <SupplierTierBadge tier={listing.supplier.tier} />
        </div>
      </div>
    </Link>
  );
}

function ListingTableRow({ listing }: { listing: Listing }) {
  const isAvailableNow = new Date(listing.availability.nextAvailable) <= new Date();

  return (
    <Link
      href={`/app/demand/listing/${listing.id}`}
      className="grid grid-cols-[1fr_120px_100px_100px_80px_80px] gap-4 px-4 py-3 hover:bg-hover border-b border-border-subtle transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm text-primary">
          {listing.gpu.count}x {listing.gpu.model}
        </span>
        <span className="text-xs text-tertiary">{listing.interconnectLabel}</span>
      </div>
      <div className="font-mono text-sm text-secondary">{listing.host.cpu.split(' ').slice(-1)}</div>
      <div className="font-mono text-sm text-secondary">{listing.host.ramGB} GB</div>
      <div className="font-mono text-sm text-secondary uppercase">{listing.region}</div>
      <div className="flex items-center">
        {isAvailableNow ? (
          <LiveDot color="success" />
        ) : (
          <span className="text-xs text-tertiary">{Math.ceil((new Date(listing.availability.nextAvailable).getTime() - Date.now()) / 3600000)}h</span>
        )}
      </div>
      <div className="font-mono text-sm text-primary">${listing.pricePerHour.toFixed(2)}</div>
    </Link>
  );
}

export default function DemandCataloguePage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'price' | 'available' | 'trust'>('price');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [deployModelFilter, setDeployModelFilter] = useState<string>('');
  const [filters, setFilters] = useState<FilterState>({
    gpuModels: [],
    gpuCounts: [],
    interconnects: [],
    regions: [],
    availableFrom: 'week',
    maxPricePerHour: 50,
    minDuration: '1h',
    trustTiers: [],
  });

  const filteredListings = useMemo(() => {
    let result = listings.filter(l => l.status === 'live');

    if (filters.gpuModels.length > 0) {
      result = result.filter(l => filters.gpuModels.includes(l.gpu.model));
    }
    if (filters.gpuCounts.length > 0) {
      result = result.filter(l => filters.gpuCounts.includes(l.gpu.count));
    }
    if (filters.interconnects.length > 0) {
      result = result.filter(l => filters.interconnects.includes(l.interconnect));
    }
    if (filters.regions.length > 0) {
      result = result.filter(l => filters.regions.includes(l.region));
    }
    result = result.filter(l => l.pricePerHour <= filters.maxPricePerHour);

    // Filter by model deployment compatibility
    if (deployModelFilter) {
      const model = AI_MODELS.find(m => m.id === deployModelFilter);
      if (model) {
        // Find the smallest variant of this model (INT4/AWQ) to get minimum VRAM needed
        const minVRAM = Math.min(...model.variants.map(v => v.minVRAMGB));
        result = result.filter(l => (l.gpu.count * l.gpu.vramGB) >= minVRAM);
      }
    }

    // Sort
    if (sortBy === 'price') {
      result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === 'available') {
      result.sort((a, b) => new Date(a.availability.nextAvailable).getTime() - new Date(b.availability.nextAvailable).getTime());
    } else if (sortBy === 'trust') {
      const tierOrder: Record<string, number> = { 'platinum': 0, 'gold': 1, 'silver': 2, 'bronze': 3 };
      result.sort((a, b) => (tierOrder[a.supplier.tier] ?? 9) - (tierOrder[b.supplier.tier] ?? 9));
    }

    return result;
  }, [filters, sortBy, deployModelFilter]);

  const toggleFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K] extends Array<infer T> ? T : never
  ) => {
    setFilters(prev => {
      const arr = prev[key] as unknown[];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter(v => v !== value) };
      }
      return { ...prev, [key]: [...arr, value] };
    });
  };

  const togglePin = (id: string) => {
    setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const pinnedListings = listings.filter(l => pinnedIds.includes(l.id));

  const gpuModelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    listings.filter(l => l.status === 'live').forEach(l => {
      counts[l.gpu.model] = (counts[l.gpu.model] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Filter Rail */}
      <aside className="w-64 shrink-0 border-r border-border-subtle p-4 space-y-6 overflow-y-auto">
        <div>
          <h3 className="text-xs font-medium text-tertiary uppercase tracking-wide mb-3">GPU Model</h3>
          <div className="space-y-2">
            {gpuModelOptions.map(model => (
              <label key={model} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.gpuModels.includes(model)}
                  onCheckedChange={() => toggleFilter('gpuModels', model)}
                  className="border-border-default data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                />
                <span className="text-sm text-secondary">{model}</span>
                <span className="ml-auto text-xs text-tertiary font-mono">{gpuModelCounts[model] || 0}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-tertiary uppercase tracking-wide mb-3">GPU Count</h3>
          <div className="flex flex-wrap gap-1.5">
            {gpuCountOptions.map(count => (
              <button
                key={count}
                onClick={() => toggleFilter('gpuCounts', count)}
                className={cn(
                  'px-2.5 py-1 text-xs font-mono rounded transition-colors',
                  filters.gpuCounts.includes(count)
                    ? 'bg-accent text-black'
                    : 'bg-elevated text-secondary hover:bg-hover'
                )}
              >
                {count}{count === 16 ? '+' : ''}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-tertiary uppercase tracking-wide mb-3">Interconnect</h3>
          <div className="flex flex-wrap gap-1.5">
            {interconnectOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggleFilter('interconnects', opt.value)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded transition-colors',
                  filters.interconnects.includes(opt.value)
                    ? 'bg-accent text-black'
                    : 'bg-elevated text-secondary hover:bg-hover'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-tertiary uppercase tracking-wide mb-3">Region</h3>
          <div className="space-y-2">
            {regionOptions.map(opt => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.regions.includes(opt.value)}
                  onCheckedChange={() => toggleFilter('regions', opt.value)}
                  className="border-border-default data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                />
                <span className="text-sm text-secondary">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-tertiary uppercase tracking-wide mb-3">Deploy Model</h3>
          <select
            value={deployModelFilter}
            onChange={(e) => setDeployModelFilter(e.target.value)}
            className="w-full h-8 px-2.5 bg-[#18181B] border border-[#3F3F46] text-[#FAFAFA] rounded-[6px] text-xs outline-none focus:border-[#84CC16] appearance-none cursor-pointer"
          >
            <option value="">Any / None</option>
            {AI_MODELS.map(model => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.parameterCount})
              </option>
            ))}
          </select>
          {deployModelFilter && (
            <p className="text-[10px] text-tertiary mt-1.5">
              Showing GPUs with enough VRAM for at least one quantization of this model.
            </p>
          )}
        </div>

        <div>
          <h3 className="text-xs font-medium text-tertiary uppercase tracking-wide mb-3">
            Max $/hr: <span className="text-primary font-mono">${filters.maxPricePerHour}</span>
          </h3>
          <Slider
            value={[filters.maxPricePerHour]}
            onValueChange={(v) => setFilters(prev => ({ ...prev, maxPricePerHour: Array.isArray(v) ? v[0] : v }))}
            max={100}
            min={1}
            step={1}
            className="w-full"
          />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="text-sm text-secondary">
            <span className="font-mono text-primary">{filteredListings.length}</span> listings
          </div>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-40 h-8 bg-surface border-border-default text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface border-border-default">
                <SelectItem value="price">Price: Low to High</SelectItem>
                <SelectItem value="available">Soonest Available</SelectItem>
                <SelectItem value="trust">Highest Trust</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex bg-surface border border-border-default rounded-md p-0.5">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  view === 'grid' ? 'bg-elevated text-primary' : 'text-tertiary hover:text-secondary'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('table')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  view === 'table' ? 'bg-elevated text-primary' : 'text-tertiary hover:text-secondary'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Listings */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredListings.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="bg-surface border border-border-subtle rounded-lg p-6 font-mono text-sm">
                <div className="text-tertiary">$ nava find --gpu h100 --count 8</div>
                <div className="text-secondary mt-1">... no results. try widening filters.</div>
              </div>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onPin={() => togglePin(listing.id)}
                  isPinned={pinnedIds.includes(listing.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_100px_100px_80px_80px] gap-4 px-4 py-2 bg-elevated text-xs text-tertiary uppercase tracking-wide border-b border-border-subtle">
                <div>Configuration</div>
                <div>CPU</div>
                <div>RAM</div>
                <div>Region</div>
                <div>Avail</div>
                <div>$/hr</div>
              </div>
              {filteredListings.map(listing => (
                <ListingTableRow key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compare Tray */}
      <AnimatePresence>
        {pinnedIds.length > 0 && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 border-l border-border-subtle overflow-hidden"
          >
            <div className="w-[280px] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-primary">Compare ({pinnedIds.length})</h3>
                <button
                  onClick={() => setPinnedIds([])}
                  className="text-xs text-tertiary hover:text-secondary"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-3">
                {pinnedListings.map(listing => (
                  <div
                    key={listing.id}
                    className="bg-surface border border-border-subtle rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-mono text-xs text-primary">
                        {listing.gpu.count}x {listing.gpu.model}
                      </div>
                      <button
                        onClick={() => togglePin(listing.id)}
                        className="text-tertiary hover:text-secondary"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-xs text-tertiary">{listing.region.toUpperCase()}</div>
                    <div className="font-mono text-sm text-accent">${listing.pricePerHour.toFixed(2)}/hr</div>
                  </div>
                ))}
              </div>
              <Link
                href={`/app/demand/compare?ids=${pinnedIds.join(',')}`}
                className="block w-full py-2 bg-accent text-black text-sm font-medium text-center rounded-md hover:bg-accent-dim transition-colors"
              >
                Compare selected
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
