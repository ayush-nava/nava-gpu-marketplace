import {
  Listing, GPUModel, Interconnect, Region, TrustTier,
  GPU_INTERCONNECT_MATRIX, INTERCONNECT_LABELS,
} from '../types';

// Deterministic seeded PRNG
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
const rng = createRng(42);

const defaultImages = [
  { id: 'ubuntu-cuda-12.4', name: 'Ubuntu 22.04 + CUDA 12.4', size: '18.2 GB' },
  { id: 'pytorch-2.4', name: 'PyTorch 2.4 + CUDA 12.4', size: '24.1 GB' },
  { id: 'jax-0.4', name: 'JAX 0.4.30 + CUDA 12.4', size: '21.8 GB' },
  { id: 'vllm-0.6', name: 'vLLM 0.6.2', size: '26.4 GB' },
  { id: 'nemo-24.07', name: 'NVIDIA NeMo 24.07', size: '32.1 GB' },
  { id: 'triton-24.08', name: 'Triton Inference Server 24.08', size: '19.7 GB' },
];

const memberDates = [
  '2024-03-15','2024-06-22','2024-01-08','2024-09-11','2024-04-30',
  '2024-07-19','2024-02-14','2024-10-05','2024-05-28','2024-08-03',
  '2023-12-20','2024-11-17','2024-03-09','2024-06-01','2024-01-25',
  '2024-08-14','2024-04-07','2024-09-23','2024-02-28','2024-07-12',
  '2024-05-16','2024-10-30','2024-03-22','2024-06-18','2024-01-11',
  '2024-08-27','2024-04-14','2024-09-06','2024-02-19','2024-07-31',
  '2024-05-03','2024-11-08','2024-03-26','2024-06-09','2024-01-30',
];

const regions: Region[] = ['na-east','na-west','eu','apac','in'];

/*
 * Realistic per-GPU specs used for benchmark generation.
 * Sources: NVIDIA datasheets, MLPerf results, published benchmarks.
 */
const gpuSpecs: Record<GPUModel, {
  vramGB: number;
  basePrice: number; // $/hr per GPU
  fp8Tflops: number; // per GPU
  hbmBwGBs: number;  // per GPU
  tdpW: number;
}> = {
  'H100 SXM5':    { vramGB: 80,  basePrice: 2.85, fp8Tflops: 1979, hbmBwGBs: 3350, tdpW: 700 },
  'H100 PCIe':    { vramGB: 80,  basePrice: 2.20, fp8Tflops: 1513, hbmBwGBs: 2000, tdpW: 350 },
  'A100 SXM':     { vramGB: 80,  basePrice: 1.75, fp8Tflops: 0,    hbmBwGBs: 2039, tdpW: 400 },
  'A100 PCIe':    { vramGB: 80,  basePrice: 1.29, fp8Tflops: 0,    hbmBwGBs: 2039, tdpW: 300 },
  'B200':         { vramGB: 192, basePrice: 4.50, fp8Tflops: 4500, hbmBwGBs: 8000, tdpW: 1000 },
  'L40S':         { vramGB: 48,  basePrice: 1.25, fp8Tflops: 733,  hbmBwGBs: 864,  tdpW: 350 },
  'RTX 4090':     { vramGB: 24,  basePrice: 0.69, fp8Tflops: 660,  hbmBwGBs: 1008, tdpW: 450 },
  'RTX 6000 Ada': { vramGB: 48,  basePrice: 1.10, fp8Tflops: 733,  hbmBwGBs: 960,  tdpW: 300 },
};

/**
 * Each entry defines a realistic, physically valid GPU offering.
 * Interconnect and count are constrained by GPU_INTERCONNECT_MATRIX.
 */
interface ListingTemplate {
  gpu: GPUModel;
  count: number;
  interconnect: Interconnect;
  cpu: string;
  vcpus: number;
  ramGB: number;
  nvmeTB: number;
  netGbps: number;
}

const templates: ListingTemplate[] = [
  // === DGX / HGX H100 SXM5 nodes (always 8x, NVSwitch) ===
  { gpu: 'H100 SXM5', count: 8, interconnect: 'nvswitch', cpu: 'Intel Xeon 8480+', vcpus: 192, ramGB: 2048, nvmeTB: 30, netGbps: 400 },
  { gpu: 'H100 SXM5', count: 8, interconnect: 'nvswitch', cpu: 'AMD EPYC 9654',   vcpus: 192, ramGB: 2048, nvmeTB: 30, netGbps: 400 },
  { gpu: 'H100 SXM5', count: 8, interconnect: 'nvswitch', cpu: 'Intel Xeon 8480+', vcpus: 192, ramGB: 2048, nvmeTB: 30, netGbps: 400 },
  { gpu: 'H100 SXM5', count: 8, interconnect: 'nvswitch', cpu: 'AMD EPYC 9554',   vcpus: 128, ramGB: 1024, nvmeTB: 15, netGbps: 400 },
  { gpu: 'H100 SXM5', count: 8, interconnect: 'nvswitch', cpu: 'Intel Xeon 8490H', vcpus: 192, ramGB: 2048, nvmeTB: 30, netGbps: 400 },

  // === H100 PCIe nodes (PCIe only, various counts) ===
  { gpu: 'H100 PCIe', count: 8, interconnect: 'pcie', cpu: 'AMD EPYC 9654',   vcpus: 192, ramGB: 1024, nvmeTB: 15, netGbps: 200 },
  { gpu: 'H100 PCIe', count: 4, interconnect: 'pcie', cpu: 'AMD EPYC 9554',   vcpus: 128, ramGB: 512,  nvmeTB: 7.5, netGbps: 100 },
  { gpu: 'H100 PCIe', count: 2, interconnect: 'pcie', cpu: 'Intel Xeon 8380',  vcpus: 64,  ramGB: 256,  nvmeTB: 3.8, netGbps: 100 },
  { gpu: 'H100 PCIe', count: 1, interconnect: 'pcie', cpu: 'Intel Xeon 8380',  vcpus: 32,  ramGB: 128,  nvmeTB: 1.9, netGbps: 25 },

  // === DGX A100 SXM nodes (always 8x, NVSwitch) ===
  { gpu: 'A100 SXM', count: 8, interconnect: 'nvswitch', cpu: 'AMD EPYC 7763',   vcpus: 128, ramGB: 1024, nvmeTB: 15, netGbps: 200 },
  { gpu: 'A100 SXM', count: 8, interconnect: 'nvswitch', cpu: 'AMD EPYC 7763',   vcpus: 128, ramGB: 2048, nvmeTB: 30, netGbps: 200 },
  { gpu: 'A100 SXM', count: 8, interconnect: 'nvswitch', cpu: 'Intel Xeon 8380',  vcpus: 128, ramGB: 1024, nvmeTB: 15, netGbps: 200 },

  // === A100 PCIe nodes (NVLink bridge for pairs, PCIe for larger) ===
  { gpu: 'A100 PCIe', count: 2, interconnect: 'nvlink-bridge', cpu: 'AMD EPYC 7763',  vcpus: 64,  ramGB: 256,  nvmeTB: 3.8, netGbps: 100 },
  { gpu: 'A100 PCIe', count: 4, interconnect: 'pcie',          cpu: 'AMD EPYC 7763',  vcpus: 128, ramGB: 512,  nvmeTB: 7.5, netGbps: 100 },
  { gpu: 'A100 PCIe', count: 1, interconnect: 'pcie',          cpu: 'Intel Xeon 8380', vcpus: 32,  ramGB: 128,  nvmeTB: 1.9, netGbps: 25 },

  // === DGX B200 nodes (always 8x, NVSwitch + NVLink 5) ===
  { gpu: 'B200', count: 8, interconnect: 'nvswitch-nvlink5', cpu: 'Intel Xeon 8570', vcpus: 192, ramGB: 2048, nvmeTB: 30, netGbps: 400 },
  { gpu: 'B200', count: 8, interconnect: 'nvswitch-nvlink5', cpu: 'Intel Xeon 8570', vcpus: 192, ramGB: 2048, nvmeTB: 30, netGbps: 400 },

  // === L40S nodes (PCIe only, no NVLink) ===
  { gpu: 'L40S', count: 8, interconnect: 'pcie', cpu: 'AMD EPYC 9654',   vcpus: 128, ramGB: 512, nvmeTB: 15, netGbps: 100 },
  { gpu: 'L40S', count: 4, interconnect: 'pcie', cpu: 'AMD EPYC 9554',   vcpus: 64,  ramGB: 256, nvmeTB: 7.5, netGbps: 100 },
  { gpu: 'L40S', count: 2, interconnect: 'pcie', cpu: 'Intel Xeon 8380',  vcpus: 32,  ramGB: 128, nvmeTB: 3.8, netGbps: 25 },
  { gpu: 'L40S', count: 1, interconnect: 'pcie', cpu: 'Intel Xeon 8380',  vcpus: 16,  ramGB: 64,  nvmeTB: 1.9, netGbps: 25 },

  // === RTX 4090 nodes (PCIe only, no NVLink) ===
  { gpu: 'RTX 4090', count: 8, interconnect: 'pcie', cpu: 'AMD EPYC 9654',   vcpus: 128, ramGB: 256, nvmeTB: 7.5, netGbps: 100 },
  { gpu: 'RTX 4090', count: 4, interconnect: 'pcie', cpu: 'AMD EPYC 7763',   vcpus: 64,  ramGB: 128, nvmeTB: 3.8, netGbps: 25 },
  { gpu: 'RTX 4090', count: 2, interconnect: 'pcie', cpu: 'Intel Xeon 8380',  vcpus: 32,  ramGB: 64,  nvmeTB: 1.9, netGbps: 25 },
  { gpu: 'RTX 4090', count: 1, interconnect: 'pcie', cpu: 'AMD EPYC 7763',   vcpus: 16,  ramGB: 64,  nvmeTB: 1.9, netGbps: 10 },

  // === RTX 6000 Ada nodes (PCIe only, no NVLink) ===
  { gpu: 'RTX 6000 Ada', count: 4, interconnect: 'pcie', cpu: 'AMD EPYC 9554',  vcpus: 64,  ramGB: 256, nvmeTB: 7.5, netGbps: 100 },
  { gpu: 'RTX 6000 Ada', count: 2, interconnect: 'pcie', cpu: 'Intel Xeon 8380', vcpus: 32,  ramGB: 128, nvmeTB: 3.8, netGbps: 25 },

  // === Duplicates for variety (different regions/suppliers) ===
  { gpu: 'H100 SXM5', count: 8, interconnect: 'nvswitch', cpu: 'AMD EPYC 9654',   vcpus: 192, ramGB: 2048, nvmeTB: 30, netGbps: 400 },
  { gpu: 'H100 SXM5', count: 8, interconnect: 'nvswitch', cpu: 'Intel Xeon 8480+', vcpus: 192, ramGB: 2048, nvmeTB: 30, netGbps: 400 },
  { gpu: 'A100 SXM',  count: 8, interconnect: 'nvswitch', cpu: 'AMD EPYC 7763',   vcpus: 128, ramGB: 1024, nvmeTB: 15, netGbps: 200 },
  { gpu: 'H100 PCIe', count: 4, interconnect: 'pcie',     cpu: 'AMD EPYC 9654',   vcpus: 128, ramGB: 512,  nvmeTB: 7.5, netGbps: 100 },
  { gpu: 'RTX 4090',  count: 4, interconnect: 'pcie',     cpu: 'AMD EPYC 9554',   vcpus: 64,  ramGB: 128,  nvmeTB: 3.8, netGbps: 25 },
  { gpu: 'L40S',      count: 4, interconnect: 'pcie',     cpu: 'AMD EPYC 9654',   vcpus: 64,  ramGB: 256,  nvmeTB: 7.5, netGbps: 100 },
  { gpu: 'B200',      count: 8, interconnect: 'nvswitch-nvlink5', cpu: 'Intel Xeon 8570', vcpus: 192, ramGB: 2048, nvmeTB: 30, netGbps: 400 },
];

function generateBenchmarks(model: GPUModel, count: number, interconnect: Interconnect) {
  const spec = gpuSpecs[model];
  const matrix = GPU_INTERCONNECT_MATRIX[model];
  const bw = matrix.perGpuBandwidth[interconnect];

  const v1 = 0.95 + rng() * 0.1;
  const v2 = 0.95 + rng() * 0.1;
  const v3 = rng();
  const v4 = 0.95 + rng() * 0.1;

  // NCCL bandwidth only meaningful for multi-GPU with high-speed interconnect
  let ncclGbps = 0;
  if (count > 1 && bw > 100) {
    ncclGbps = Math.round(bw * 0.85 * v1); // ~85% of theoretical
  } else if (count > 1) {
    ncclGbps = Math.round(bw * 0.7 * v1); // PCIe is less efficient
  }

  return {
    nccl_gbps: ncclGbps,
    gemm_tflops: spec.fp8Tflops > 0 ? Math.round(spec.fp8Tflops * count * v2) : Math.round(312 * count * v2), // A100 uses TF32
    mfu_pct: Math.round((48 + v3 * 14) * 10) / 10,
    hbm_gbps: Math.round(spec.hbmBwGBs * v4),
    verifiedAt: '2026-04-28T10:30:00.000Z',
  };
}

function generateAvailability(index: number) {
  const baseDate = '2026-04-30T08:00:00.000Z';
  const baseMs = new Date(baseDate).getTime();
  const isAvailableNow = index % 3 !== 2;

  const bookedSlots: Array<[string, string]> = [];
  const numSlots = (index * 7 + 3) % 4;
  let cursor = baseMs + (isAvailableNow ? 6 : 0) * 3600000;

  for (let i = 0; i < numSlots; i++) {
    const startOffset = ((index * 13 + i * 17) % 48) * 3600000;
    const duration = ((index * 7 + i * 11) % 24 + 2) * 3600000;
    const start = cursor + startOffset;
    const end = start + duration;
    bookedSlots.push([new Date(start).toISOString(), new Date(end).toISOString()]);
    cursor = end;
  }

  return {
    nextAvailable: isAvailableNow ? baseDate : new Date(baseMs + ((index * 31) % 24) * 3600000).toISOString(),
    bookedSlots,
  };
}

function generateListing(index: number, template: ListingTemplate): Listing {
  const spec = gpuSpecs[template.gpu];
  const matrix = GPU_INTERCONNECT_MATRIX[template.gpu];
  const priceVariance = 0.88 + rng() * 0.24;
  const pricePerHour = Math.round(spec.basePrice * template.count * priceVariance * 100) / 100;

  const region = regions[index % regions.length];
  const tierOptions: TrustTier[] = ['platinum', 'gold', 'silver', 'bronze'];
  const tier = tierOptions[index % tierOptions.length];

  const completedRentals = Math.floor(rng() * 500) + (tier === 'platinum' ? 500 : tier === 'gold' ? 200 : tier === 'silver' ? 50 : 5);
  const uptime = tier === 'platinum' ? 99.99 + rng() * 0.009 : tier === 'gold' ? 99.95 + rng() * 0.04 : tier === 'silver' ? 99.9 + rng() * 0.05 : 99.5 + rng() * 0.4;

  return {
    id: `lst-${String(index + 1).padStart(4, '0')}`,
    gpu: { model: template.gpu, count: template.count, vramGB: spec.vramGB },
    interconnect: template.interconnect,
    interconnectLabel: INTERCONNECT_LABELS[template.interconnect],
    interconnectBandwidth: matrix.perGpuBandwidth[template.interconnect],
    host: {
      cpu: template.cpu,
      vcpus: template.vcpus,
      ramGB: template.ramGB,
      nvmeGB: Math.round(template.nvmeTB * 1000),
      netGbps: template.netGbps,
    },
    region,
    pricePerHour,
    availability: generateAvailability(index),
    benchmarks: generateBenchmarks(template.gpu, template.count, template.interconnect),
    supplier: {
      id: `sup-${String(index + 1).padStart(4, '0')}`,
      tier,
      completedRentals,
      uptime: Math.round(uptime * 1000) / 1000,
      memberSince: memberDates[index % memberDates.length],
      responseTime: tier === 'platinum' ? '1m' : tier === 'gold' ? `${Math.floor(rng() * 3) + 2}m` : `${Math.floor(rng() * 10) + 5}m`,
      eccErrorRate: tier === 'platinum' ? 0 : tier === 'gold' ? Math.floor(rng() * 2) : Math.floor(rng() * 5),
      lastVerified: '2026-04-28T10:30:00.000Z',
    },
    images: defaultImages,
    status: index % 11 === 10 ? 'rented' : 'live',
    createdAt: '2026-04-15T12:00:00.000Z',
  };
}

export const listings: Listing[] = templates.map((t, i) => generateListing(i, t));

export const featuredListings = listings.filter(l =>
  (l.supplier.tier === 'platinum' || l.supplier.tier === 'gold') && l.status === 'live'
).slice(0, 8);
