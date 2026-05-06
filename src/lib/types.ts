export type GPUModel = 'H100 SXM5' | 'H100 PCIe' | 'A100 SXM' | 'A100 PCIe' | 'B200' | 'L40S' | 'RTX 4090' | 'RTX 6000 Ada';

export type Interconnect = 'pcie' | 'nvlink-bridge' | 'nvswitch' | 'nvswitch-nvlink5';

export type Region = 'na-east' | 'na-west' | 'eu' | 'apac' | 'in';

export type TrustTier = 'platinum' | 'gold' | 'silver' | 'bronze';

/**
 * Supplier Tier System
 * 
 * Tiers are assigned based on:
 * - Uptime SLA (measured over rolling 30 days)
 * - Completed rentals (track record)
 * - Hardware verification status
 * - Response time to issues
 * - ECC error rate
 * 
 * Pricing is influenced by tier — higher tiers command a premium
 * because they offer better reliability guarantees.
 */
export const SUPPLIER_TIERS: Record<TrustTier, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  uptimeSLA: string;
  minCompletedRentals: number;
  pricingMultiplier: number; // 1.0 = base, higher = premium
  features: string[];
}> = {
  platinum: {
    label: 'Platinum',
    description: 'Enterprise-grade reliability with 99.99% uptime SLA',
    color: 'text-[#E5E4E2]',
    bgColor: 'bg-[#E5E4E2]/10',
    borderColor: 'border-[#E5E4E2]/30',
    uptimeSLA: '99.99%',
    minCompletedRentals: 500,
    pricingMultiplier: 1.25,
    features: ['99.99% uptime SLA', 'Priority support (<2min)', 'Auto-failover', 'Dedicated monitoring', 'Hardware redundancy'],
  },
  gold: {
    label: 'Gold',
    description: 'High reliability with 99.95% uptime SLA',
    color: 'text-[#FFD700]',
    bgColor: 'bg-[#FFD700]/10',
    borderColor: 'border-[#FFD700]/30',
    uptimeSLA: '99.95%',
    minCompletedRentals: 200,
    pricingMultiplier: 1.12,
    features: ['99.95% uptime SLA', 'Fast support (<5min)', 'Health monitoring', 'Verified benchmarks'],
  },
  silver: {
    label: 'Silver',
    description: 'Reliable with 99.9% uptime SLA',
    color: 'text-[#C0C0C0]',
    bgColor: 'bg-[#C0C0C0]/10',
    borderColor: 'border-[#C0C0C0]/30',
    uptimeSLA: '99.9%',
    minCompletedRentals: 50,
    pricingMultiplier: 1.0,
    features: ['99.9% uptime SLA', 'Standard support (<15min)', 'Basic monitoring'],
  },
  bronze: {
    label: 'Bronze',
    description: 'Entry-level providers, best-effort availability',
    color: 'text-[#CD7F32]',
    bgColor: 'bg-[#CD7F32]/10',
    borderColor: 'border-[#CD7F32]/30',
    uptimeSLA: '99.5%',
    minCompletedRentals: 0,
    pricingMultiplier: 0.85,
    features: ['99.5% uptime SLA', 'Community support', 'Basic verification'],
  },
};

export type ListingStatus = 'live' | 'paused' | 'rented' | 'maintenance';

export type RentalStatus = 'active' | 'scheduled' | 'completed' | 'cancelled';

export interface GPU {
  model: GPUModel;
  count: number;
  vramGB: number;
}

export interface Host {
  cpu: string;
  vcpus: number;
  ramGB: number;
  nvmeGB: number;
  netGbps: number;
}

export interface Benchmarks {
  nccl_gbps: number;
  gemm_tflops: number;
  mfu_pct: number;
  hbm_gbps: number;
  verifiedAt: string;
}

export interface Supplier {
  id: string; // anonymous ID, not shown to users
  tier: TrustTier;
  completedRentals: number;
  uptime: number;
  memberSince: string;
  responseTime: string;
  eccErrorRate: number; // errors per million hours
  lastVerified: string;
}

export interface Image {
  id: string;
  name: string;
  size: string;
}

export interface Availability {
  nextAvailable: string;
  bookedSlots: Array<[string, string]>;
}

export interface Listing {
  id: string;
  gpu: GPU;
  interconnect: Interconnect;
  host: Host;
  region: Region;
  pricePerHour: number;
  availability: Availability;
  benchmarks: Benchmarks;
  supplier: Supplier;
  images: Image[];
  status: ListingStatus;
  createdAt: string;
  /** Human-readable interconnect label */
  interconnectLabel: string;
  /** Bidirectional bandwidth per GPU in GB/s */
  interconnectBandwidth: number;
}

export interface Rental {
  id: string;
  listingId: string;
  listing: Listing;
  startTime: string;
  endTime: string;
  status: RentalStatus;
  sshHost: string;
  sshPort: number;
  sshUser: string;
  sshFingerprint: string;
  totalCost: number;
}

export interface TelemetryData {
  gpuIndex: number;
  utilization: number;
  vramUsed: number;
  vramTotal: number;
  temperature: number;
  powerDraw: number;
  history: number[];
}

export interface FilterState {
  gpuModels: GPUModel[];
  gpuCounts: number[];
  interconnects: Interconnect[];
  regions: Region[];
  availableFrom: 'now' | '1h' | 'today' | 'week';
  maxPricePerHour: number;
  minDuration: '1h' | '6h' | '24h' | '7d';
  trustTiers: TrustTier[];
}

export interface SupplierProfile {
  type: 'individual' | 'startup' | 'datacenter';
  displayName: string;
  location: string;
  verified: boolean;
}

export interface OnboardingState {
  step: number;
  profile: SupplierProfile | null;
  hardware: {
    gpu: GPU | null;
    interconnect: Interconnect;
    host: Host | null;
  };
  diagnostics: {
    completed: boolean;
    results: Benchmarks | null;
  };
  availability: {
    mode: 'always' | 'windowed' | 'specific';
    minDuration: string;
    blackoutDates: string[];
  };
  pricing: {
    mode: 'manual' | 'auto';
    hourlyRate: number;
    dailyDiscount: number;
    weeklyDiscount: number;
  };
  policies: {
    allowedWorkloads: string[];
    autoWipe: boolean;
    minTrustTier: TrustTier;
  };
}

/**
 * GPU interconnect compatibility matrix.
 * Based on actual NVIDIA hardware specifications:
 *
 * H100 SXM5:  NVLink 4.0, 900 GB/s. DGX/HGX: 8 GPUs via 4x NVSwitch (full mesh).
 * H100 PCIe:  No NVLink. PCIe Gen5 only. Multi-node via InfiniBand.
 * A100 SXM:   NVLink 3.0, 600 GB/s. DGX: 8 GPUs via 6x NVSwitch.
 * A100 PCIe:  NVLink 3.0 bridge, 2 GPUs only (600 GB/s pair). Otherwise PCIe.
 * B200:       NVLink 5.0, 1800 GB/s. DGX: 8 GPUs via NVSwitch.
 * L40S:       Ada Lovelace, PCIe Gen4 only. No NVLink.
 * RTX 4090:   Ada Lovelace consumer. No NVLink (removed from RTX 40 series).
 * RTX 6000 Ada: Ada Lovelace pro. No NVLink (removed from Ada generation).
 */
export const GPU_INTERCONNECT_MATRIX: Record<GPUModel, {
  validInterconnects: Interconnect[];
  validCounts: number[];
  nvlinkVersion: string | null;
  perGpuBandwidth: Record<Interconnect, number>; // GB/s bidirectional
}> = {
  'H100 SXM5': {
    validInterconnects: ['nvswitch'],
    validCounts: [8],
    nvlinkVersion: '4.0',
    perGpuBandwidth: { 'pcie': 128, 'nvlink-bridge': 0, 'nvswitch': 900, 'nvswitch-nvlink5': 0 },
  },
  'H100 PCIe': {
    validInterconnects: ['pcie'],
    validCounts: [1, 2, 4, 8],
    nvlinkVersion: null,
    perGpuBandwidth: { 'pcie': 128, 'nvlink-bridge': 0, 'nvswitch': 0, 'nvswitch-nvlink5': 0 },
  },
  'A100 SXM': {
    validInterconnects: ['nvswitch'],
    validCounts: [8],
    nvlinkVersion: '3.0',
    perGpuBandwidth: { 'pcie': 64, 'nvlink-bridge': 0, 'nvswitch': 600, 'nvswitch-nvlink5': 0 },
  },
  'A100 PCIe': {
    validInterconnects: ['pcie', 'nvlink-bridge'],
    validCounts: [1, 2, 4],
    nvlinkVersion: '3.0 (bridge only)',
    perGpuBandwidth: { 'pcie': 64, 'nvlink-bridge': 600, 'nvswitch': 0, 'nvswitch-nvlink5': 0 },
  },
  'B200': {
    validInterconnects: ['nvswitch-nvlink5'],
    validCounts: [8],
    nvlinkVersion: '5.0',
    perGpuBandwidth: { 'pcie': 128, 'nvlink-bridge': 0, 'nvswitch': 0, 'nvswitch-nvlink5': 1800 },
  },
  'L40S': {
    validInterconnects: ['pcie'],
    validCounts: [1, 2, 4, 8],
    nvlinkVersion: null,
    perGpuBandwidth: { 'pcie': 64, 'nvlink-bridge': 0, 'nvswitch': 0, 'nvswitch-nvlink5': 0 },
  },
  'RTX 4090': {
    validInterconnects: ['pcie'],
    validCounts: [1, 2, 4, 8],
    nvlinkVersion: null,
    perGpuBandwidth: { 'pcie': 64, 'nvlink-bridge': 0, 'nvswitch': 0, 'nvswitch-nvlink5': 0 },
  },
  'RTX 6000 Ada': {
    validInterconnects: ['pcie'],
    validCounts: [1, 2, 4],
    nvlinkVersion: null,
    perGpuBandwidth: { 'pcie': 64, 'nvlink-bridge': 0, 'nvswitch': 0, 'nvswitch-nvlink5': 0 },
  },
};

export const INTERCONNECT_LABELS: Record<Interconnect, string> = {
  'pcie': 'PCIe',
  'nvlink-bridge': 'NVLink Bridge',
  'nvswitch': 'NVSwitch',
  'nvswitch-nvlink5': 'NVSwitch (NVLink 5)',
};
