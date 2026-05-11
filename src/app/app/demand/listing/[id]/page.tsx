'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { listings } from '@/lib/mock';
import { LiveDot } from '@/components/ui/live-dot';
import { MonoStat } from '@/components/ui/mono-stat';
import { SupplierTierBadge } from '@/components/supplier-tier-badge';
import { SpecTable } from '@/components/ui/spec-table';
import { TopologyDiagram } from '@/components/topology-diagram';
import { AvailabilityStrip } from '@/components/availability-strip';
import { ModelDeployCard } from '@/components/model-deploy-card';

const durationOptions = [
  { value: '1', label: '1 hour' },
  { value: '6', label: '6 hours' },
  { value: '24', label: '24 hours' },
  { value: '72', label: '3 days' },
  { value: '168', label: '7 days' },
];

const provisioningSteps = [
  'Allocating node',
  'Flashing image',
  'Injecting SSH key',
  'Running health check',
  'Ready',
];

const sections = ['Specs', 'Benchmarks', 'Software', 'Supplier'] as const;
type Section = (typeof sections)[number];

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  // Handle derived listing IDs (vGPU and Slice)
  // Format: lst-XXXX-vgpu-N or lst-XXXX-slice-N
  const derivedListing = useMemo(() => {
    if (id.includes('-vgpu-')) {
      const parts = id.split('-vgpu-');
      const parentId = parts[0];
      const gpuCount = parseInt(parts[1]);
      const parent = listings.find(l => l.id === parentId);
      if (!parent) return null;
      return {
        ...parent,
        id,
        gpu: { ...parent.gpu, count: gpuCount },
        pricePerHour: (parent.pricePerHour / parent.gpu.count) * gpuCount * 1.08,
        accessType: 'vgpu' as const,
      };
    }
    if (id.includes('-slice-')) {
      const parts = id.split('-slice-');
      const parentId = parts[0];
      const parent = listings.find(l => l.id === parentId);
      if (!parent) return null;
      return {
        ...parent,
        id,
        gpu: { ...parent.gpu, count: 1, vramGB: Math.floor(parent.gpu.vramGB / 2) },
        pricePerHour: (parent.pricePerHour / parent.gpu.count) * 0.55 * 1.10,
        interconnect: 'pcie' as const,
        interconnectLabel: 'Virtual',
        interconnectBandwidth: 0,
        accessType: 'slice' as const,
      };
    }
    return null;
  }, [id]);

  const listing = derivedListing || listings.find(l => l.id === id) || null;

  const [duration, setDuration] = useState('24');
  const [selectedImage, setSelectedImage] = useState(listing?.images[0]?.id || '');
  const [sshKey, setSshKey] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisioningStep, setProvisioningStep] = useState(0);
  const [deployConfig, setDeployConfig] = useState<{ modelId: string; variantId: string; runtime: string; useCase: string } | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('Specs');

  if (!listing) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="text-center space-y-4">
          <div className="font-mono text-tertiary">Listing not found</div>
          <Link href="/app/demand" className="text-accent hover:underline">
            Back to catalogue
          </Link>
        </div>
      </div>
    );
  }

  const isAvailableNow = new Date(listing.availability.nextAvailable) <= new Date();
  const totalCost = listing.pricePerHour * parseInt(duration);

  const handleReserve = async () => {
    setIsProvisioning(true);
    setProvisioningStep(0);

    for (let i = 0; i < provisioningSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      setProvisioningStep(i + 1);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    router.push(`/app/demand/rentals/rnt-new?from=${listing.id}${deployConfig ? `&model=${deployConfig.modelId}&variant=${deployConfig.variantId}&runtime=${deployConfig.runtime}` : ''}`);
  };

  const specs = [
    { label: 'GPU', value: `${listing.gpu.count}x ${listing.gpu.model}` },
    { label: 'VRAM per GPU', value: `${listing.gpu.vramGB} GB` },
    { label: 'Interconnect', value: `${listing.interconnectLabel} (${listing.interconnectBandwidth} GB/s)` },
    { label: 'Host CPU', value: listing.host.cpu },
    { label: 'vCPUs', value: listing.host.vcpus.toString() },
    { label: 'System RAM', value: `${listing.host.ramGB} GB DDR5` },
    { label: 'NVMe Storage', value: `${(listing.host.nvmeGB / 1000).toFixed(1)} TB` },
    { label: 'Network', value: `${listing.host.netGbps} Gbps` },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      {/* Back link */}
      <Link
        href="/app/demand"
        className="inline-flex items-center gap-1.5 text-sm text-tertiary hover:text-secondary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to catalogue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-primary tracking-tight">
                {listing.gpu.count}x {listing.gpu.model}
                <span className="text-secondary font-normal"> · {listing.interconnectLabel}</span>
              </h1>
              {isAvailableNow && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-success/10 rounded">
                  <LiveDot color="success" />
                  <span className="text-xs text-success font-medium">Available now</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-tertiary">
              <SupplierTierBadge tier={listing.supplier.tier} showSLA />
              <span>·</span>
              <span className="font-mono uppercase">{listing.region}</span>
              <span>·</span>
              <span>{listing.supplier.completedRentals} rentals</span>
            </div>
          </div>

          {/* Topology Diagram */}
          <div className="bg-surface border border-border-subtle rounded-card p-6">
            <h2 className="text-sm font-medium text-tertiary uppercase tracking-wide mb-4">
              Topology
            </h2>
            <div className="flex justify-center">
              <TopologyDiagram
                gpuCount={listing.gpu.count}
                interconnect={listing.interconnect}
                showLabels
              />
            </div>
          </div>

          {/* Section Buttons */}
          <div>
            <div className="bg-surface border border-border-subtle rounded-lg p-1 flex">
              {sections.map(section => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    activeSection === section
                      ? 'bg-elevated text-primary'
                      : 'text-tertiary hover:text-secondary'
                  )}
                >
                  {section}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {activeSection === 'Specs' && (
                <div className="bg-surface border border-border-subtle rounded-card p-6">
                  <SpecTable rows={specs} columns={2} />
                </div>
              )}

              {activeSection === 'Benchmarks' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface border border-border-subtle rounded-card p-4 space-y-1">
                    <div className="text-xs text-tertiary uppercase tracking-wide">NCCL AllReduce</div>
                    <div className="font-mono text-xl text-primary">{listing.benchmarks.nccl_gbps} GB/s</div>
                    <div className="text-xs text-tertiary">
                      verified {new Date(listing.benchmarks.verifiedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="bg-surface border border-border-subtle rounded-card p-4 space-y-1">
                    <div className="text-xs text-tertiary uppercase tracking-wide">GEMM FP8</div>
                    <div className="font-mono text-xl text-primary">{listing.benchmarks.gemm_tflops.toLocaleString()} TFLOPS</div>
                    <div className="text-xs text-tertiary">aggregate across {listing.gpu.count} GPUs</div>
                  </div>
                  <div className="bg-surface border border-border-subtle rounded-card p-4 space-y-1">
                    <div className="text-xs text-tertiary uppercase tracking-wide">MFU (Llama-70B FT)</div>
                    <div className="font-mono text-xl text-primary">{listing.benchmarks.mfu_pct}%</div>
                    <div className="text-xs text-tertiary">model flops utilization</div>
                  </div>
                  <div className="bg-surface border border-border-subtle rounded-card p-4 space-y-1">
                    <div className="text-xs text-tertiary uppercase tracking-wide">HBM Bandwidth</div>
                    <div className="font-mono text-xl text-primary">{(listing.benchmarks.hbm_gbps / 1000).toFixed(1)} TB/s</div>
                    <div className="text-xs text-tertiary">per GPU</div>
                  </div>
                </div>
              )}

              {activeSection === 'Software' && (
                <div className="grid grid-cols-2 gap-3">
                  {listing.images.map(image => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(image.id)}
                      className={cn(
                        'p-4 rounded-card border text-left transition-colors',
                        selectedImage === image.id
                          ? 'bg-accent/10 border-accent'
                          : 'bg-surface border-border-subtle hover:border-border-default'
                      )}
                    >
                      <div className="text-sm text-primary font-medium">{image.name}</div>
                      <div className="text-xs text-tertiary font-mono mt-1">{image.size}</div>
                    </button>
                  ))}
                </div>
              )}

              {activeSection === 'Supplier' && (
                <div className="bg-surface border border-border-subtle rounded-card p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-elevated rounded-full flex items-center justify-center">
                      <span className="font-mono text-sm text-secondary">{listing.supplier.tier.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <SupplierTierBadge tier={listing.supplier.tier} showSLA size="md" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
                    <MonoStat label="Completed Rentals" value={listing.supplier.completedRentals} />
                    <MonoStat label="Uptime" value={`${listing.supplier.uptime.toFixed(3)}%`} />
                    <MonoStat label="Response Time" value={listing.supplier.responseTime} />
                    <MonoStat label="ECC Errors" value={listing.supplier.eccErrorRate === 0 ? 'None' : `${listing.supplier.eccErrorRate}/Mhr`} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Card */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="bg-surface border border-border-subtle rounded-card p-6 space-y-6">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="font-mono text-2xl text-primary">${listing.pricePerHour.toFixed(2)}</span>
                <span className="text-secondary">/hr</span>
              </div>
              <div className="text-sm text-tertiary">
                ~${(listing.pricePerHour * 24).toFixed(0)}/day
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs text-tertiary uppercase tracking-wide">Duration</label>
              <div className="flex flex-wrap gap-2">
                {durationOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setDuration(opt.value)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-md transition-colors',
                      duration === opt.value
                        ? 'bg-accent text-black font-medium'
                        : 'bg-elevated text-secondary hover:bg-hover'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability Strip */}
            <div className="space-y-2">
              <label className="text-xs text-tertiary uppercase tracking-wide">Availability</label>
              <AvailabilityStrip availability={listing.availability} />
            </div>

            {/* Image Selector */}
            <div className="space-y-2">
              <label className="text-xs text-tertiary uppercase tracking-wide">Base Image</label>
              <select
                value={selectedImage}
                onChange={(e) => setSelectedImage(e.target.value)}
                className="w-full h-9 px-3 bg-[#18181B] border border-[#3F3F46] text-[#FAFAFA] rounded-md text-sm outline-none focus:border-[#84CC16] appearance-none cursor-pointer"
              >
                {listing.images.map(image => (
                  <option key={image.id} value={image.id}>{image.name}</option>
                ))}
              </select>
            </div>

            {/* Model Deployment */}
            <div className="space-y-2">
              <label className="text-xs text-tertiary uppercase tracking-wide">Model Deployment</label>
              <ModelDeployCard
                gpuModel={listing.gpu.model}
                gpuCount={listing.gpu.count}
                vramPerGPU={listing.gpu.vramGB}
                pricePerHour={listing.pricePerHour}
                onConfigChange={setDeployConfig}
              />
            </div>

            {/* SSH Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-tertiary uppercase tracking-wide">SSH Public Key</label>
                <button className="text-xs text-accent hover:underline">or generate</button>
              </div>
              <textarea
                value={sshKey}
                onChange={(e) => setSshKey(e.target.value)}
                placeholder="ssh-ed25519 AAAA..."
                className="w-full h-20 px-3 py-2 bg-elevated border border-border-default rounded-md text-sm font-mono text-primary placeholder:text-tertiary resize-none focus:outline-none focus:border-accent"
              />
            </div>

            {/* Cost Summary */}
            <div className="pt-4 border-t border-border-subtle space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">
                  ${listing.pricePerHour.toFixed(2)}/hr x {duration}h
                </span>
                <span className="font-mono text-primary">${totalCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Reserve Button */}
            <AnimatePresence mode="wait">
              {isProvisioning ? (
                <motion.div
                  key="provisioning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {provisioningSteps.map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      {provisioningStep > i ? (
                        <Check className="w-4 h-4 text-accent" />
                      ) : provisioningStep === i ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 border border-border-default rounded-full" />
                      )}
                      <span className={cn(
                        'text-sm',
                        provisioningStep > i ? 'text-accent' : provisioningStep === i ? 'text-primary' : 'text-tertiary'
                      )}>
                        {step}
                      </span>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.button
                  key="reserve"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleReserve}
                  disabled={!isAvailableNow}
                  className={cn(
                    'w-full py-3 rounded-md text-sm font-medium transition-colors',
                    isAvailableNow
                      ? 'bg-accent text-black hover:bg-accent-dim'
                      : 'bg-elevated text-tertiary cursor-not-allowed'
                  )}
                >
                  {isAvailableNow ? 'Reserve node' : 'Not available'}
                </motion.button>
              )}
            </AnimatePresence>

            {!isAvailableNow && (
              <div className="flex items-center gap-2 text-xs text-tertiary">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Available in {Math.ceil((new Date(listing.availability.nextAvailable).getTime() - Date.now()) / 3600000)} hours
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
