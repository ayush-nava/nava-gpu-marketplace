export type GPUModel = 'H100 SXM5' | 'H100 PCIe' | 'A100 SXM' | 'A100 PCIe' | 'B200' | 'L40S' | 'RTX 4090' | 'RTX 6000 Ada';

export type Interconnect = 'pcie' | 'nvlink-bridge' | 'nvswitch' | 'nvswitch-nvlink5';

export type Region = 'na-east' | 'na-west' | 'eu' | 'apac' | 'in';

export type TrustTier = 'verified+' | 'verified' | 'new';

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
  handle: string;
  tier: TrustTier;
  completedRentals: number;
  uptime: number;
  memberSince: string;
  responseTime: string;
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
