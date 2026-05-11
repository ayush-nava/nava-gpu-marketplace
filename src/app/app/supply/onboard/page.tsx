'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Upload, Loader2 } from 'lucide-react';
import { TierPricingChart } from '@/components/tier-pricing-chart';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { GPUModel, Interconnect } from '@/lib/types';
import { TopologyDiagram } from '@/components/topology-diagram';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ─── constants ─── */
const STEPS = [
  'Provider Profile',
  'Hardware',
  'Install Agent',
  'Diagnostics',
  'Availability',
  'Pricing',
  'Review & Publish',
] as const;

const GPU_MODELS: GPUModel[] = [
  'H100 SXM5', 'H100 PCIe', 'A100 SXM', 'A100 PCIe',
  'B200', 'L40S', 'RTX 4090', 'RTX 6000 Ada',
];

const GPU_COUNTS = [1, 2, 4, 8, 16];

const INTERCONNECTS: Interconnect[] = [
  'pcie', 'nvlink-bridge', 'nvswitch', 'nvswitch-nvlink5',
];

const PROVIDER_TYPES = ['Individual', 'Startup', 'Datacenter'] as const;

const DURATION_CHIPS = [
  { label: '1h', value: '1h' },
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
] as const;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const VRAM_MAP: Record<GPUModel, number> = {
  'H100 SXM5': 80, 'H100 PCIe': 80, 'A100 SXM': 80, 'A100 PCIe': 80,
  'B200': 192, 'L40S': 48, 'RTX 4090': 24, 'RTX 6000 Ada': 48,
};

const DIAG_STAGES = [
  { label: 'Detecting GPUs', lines: ['Scanning PCIe bus...', 'Found NVIDIA driver 535.129.03', 'Enumerating devices...'] },
  { label: 'NCCL all-reduce test', lines: ['Initializing NCCL 2.19.3...', 'Running all-reduce benchmark...', 'busbw: 238.4 GB/s'] },
  { label: 'NVLink bandwidth test', lines: ['Probing NVLink topology...', 'Peer-to-peer bandwidth: 600 GB/s', 'Bidirectional: 1.2 TB/s'] },
  { label: 'Network egress test', lines: ['Testing egress to us-east-1...', 'Throughput: 98.2 Gbps', 'Latency: 0.4ms'] },
] as const;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

/* ─── main component ─── */
export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 0 – Provider Profile
  const [providerType, setProviderType] = useState<string>('Individual');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // Step 1 – Hardware
  const [gpuModel, setGpuModel] = useState<GPUModel>('H100 SXM5');
  const [gpuCount, setGpuCount] = useState<number>(8);
  const [interconnect, setInterconnect] = useState<Interconnect>('nvswitch');
  const [allowSlicing, setAllowSlicing] = useState(true);
  const [cpuModel, setCpuModel] = useState('AMD EPYC 9654');
  const [vcpus, setVcpus] = useState('192');
  const [ramGb, setRamGb] = useState('2048');
  const [nvmeTb, setNvmeTb] = useState('30.72');
  const [netGbps, setNetGbps] = useState('100');

  // Step 2 – Install Agent
  const [agentInstalling, setAgentInstalling] = useState(false);
  const [agentInstalled, setAgentInstalled] = useState(false);
  const [agentToken] = useState('nva_tk_7f3a9b2c1d4e5f6a8b9c0d1e2f3a4b5c');

  // Step 3 – Diagnostics
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagStage, setDiagStage] = useState(-1);
  const [diagLines, setDiagLines] = useState<string[]>([]);
  const [diagComplete, setDiagComplete] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);

  // Step 4 – Availability
  const [scheduleMode, setScheduleMode] = useState<'always' | 'windowed' | 'specific'>('always');
  const [minDuration, setMinDuration] = useState('1h');
  const [weeklyGrid, setWeeklyGrid] = useState<boolean[][]>(
    Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => true))
  );

  // Step 4 – Pricing
  const [pricingMode, setPricingMode] = useState<'manual' | 'auto'>('manual');
  const [hourlyRate, setHourlyRate] = useState('3.50');
  const [dailyDiscount, setDailyDiscount] = useState('10');
  const [weeklyDiscount, setWeeklyDiscount] = useState('20');
  const [floorPrice, setFloorPrice] = useState([2.0]);

  // Step 5 – Review
  const [autoWipe, setAutoWipe] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  /* ─── validation ─── */
  const canContinue = useCallback(() => {
    switch (step) {
      case 0: return displayName.trim().length > 0 && location.trim().length > 0;
      case 1: return true;
      case 2: return agentInstalled;
      case 3: return diagComplete;
      case 4: return true;
      case 5: return pricingMode === 'auto' || parseFloat(hourlyRate) > 0;
      case 6: return true;
      default: return true;
    }
  }, [step, displayName, location, agentInstalled, diagComplete, pricingMode, hourlyRate]);

  const goNext = () => {
    if (step < STEPS.length - 1 && canContinue()) {
      setDirection(1);
      setStep(s => s + 1);
    }
  };
  const goBack = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  /* ─── diagnostics runner ─── */
  const runDiagnostics = useCallback(() => {
    setDiagRunning(true);
    setDiagStage(0);
    setDiagLines([]);
    setDiagComplete(false);
    let totalDelay = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    DIAG_STAGES.forEach((stage, si) => {
      timers.push(setTimeout(() => {
        setDiagStage(si);
        setDiagLines(prev => [...prev, `\n── ${stage.label} ──`]);
      }, totalDelay));
      totalDelay += 300;
      stage.lines.forEach((line) => {
        timers.push(setTimeout(() => {
          setDiagLines(prev => [...prev, `  ${line}`]);
        }, totalDelay));
        totalDelay += 400 + Math.random() * 300;
      });
      totalDelay += 200;
    });
    timers.push(setTimeout(() => {
      setDiagLines(prev => [...prev, '\n✓ All checks passed']);
      setDiagRunning(false);
      setDiagComplete(true);
    }, totalDelay));
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [diagLines]);

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => { setVerifying(false); setVerified(true); }, 1500);
  };

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => { setPublishing(false); setPublished(true); }, 1500);
  };

  const toggleGridCell = (day: number, hour: number) => {
    setWeeklyGrid(prev => {
      const next = prev.map(row => [...row]);
      next[day][hour] = !next[day][hour];
      return next;
    });
  };

  const projectedUtilization = pricingMode === 'auto' ? 87 : 72;
  const effectiveRate = pricingMode === 'auto' ? floorPrice[0] * 1.4 : parseFloat(hourlyRate) || 0;
  const weeklyRevenue = (effectiveRate * 24 * 7 * (projectedUtilization / 100)).toFixed(0);


  /* ─── progress strip ─── */
  const renderProgressStrip = () => (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1 flex-1">
          <button
            onClick={() => { if (i < step) { setDirection(-1); setStep(i); } }}
            className={cn(
              'flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
              i === step && 'bg-[#84CC16]/10 text-[#84CC16] border border-[#84CC16]/30',
              i < step && 'text-[#84CC16] cursor-pointer hover:bg-[#84CC16]/5',
              i > step && 'text-[#A1A1AA]',
            )}
          >
            <span className={cn(
              'flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-mono font-bold border',
              i === step && 'border-[#84CC16] text-[#84CC16]',
              i < step && 'border-[#84CC16] bg-[#84CC16] text-[#0A0A0B]',
              i > step && 'border-[#27272A] text-[#A1A1AA]',
            )}>
              {i < step ? <Check className="w-3 h-3" /> : i + 1}
            </span>
            <span className="hidden lg:inline">{label}</span>
          </button>
          {i < STEPS.length - 1 && (
            <div className={cn('flex-1 h-px', i < step ? 'bg-[#84CC16]/40' : 'bg-[#1F1F23]')} />
          )}
        </div>
      ))}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     Step 0 – Provider Profile
     ═══════════════════════════════════════════════════════════════ */
  const renderProviderProfile = () => (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-[#FAFAFA] mb-1">Provider Profile</h2>
        <p className="text-sm text-[#A1A1AA]">Tell us about your organization.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#A1A1AA]">Provider Type</label>
        <div className="flex gap-2">
          {PROVIDER_TYPES.map(t => (
            <button key={t} onClick={() => setProviderType(t)} className={cn(
              'px-4 py-2 rounded-[6px] text-sm font-medium border transition-colors',
              providerType === t
                ? 'border-[#84CC16]/50 bg-[#84CC16]/10 text-[#84CC16]'
                : 'border-[#27272A] bg-[#111113] text-[#A1A1AA] hover:border-[#3F3F46]',
            )}>{t}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#A1A1AA]">Display Name</label>
        <Input value={displayName} onChange={e => setDisplayName(e.target.value)}
          placeholder="e.g. Lambda Cloud West"
          className="bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#A1A1AA] rounded-[6px]" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#A1A1AA]">Location</label>
        <Input value={location} onChange={e => setLocation(e.target.value)}
          placeholder="e.g. us-west-2 / San Jose, CA"
          className="bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] placeholder:text-[#A1A1AA] rounded-[6px]" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#A1A1AA]">Verification Document</label>
        {verified ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-[#84CC16]/10 border border-[#84CC16]/30">
            <Check className="w-4 h-4 text-[#84CC16]" />
            <span className="text-sm font-medium text-[#84CC16]">Verified</span>
          </div>
        ) : (
          <button onClick={handleVerify} disabled={verifying} className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-[10px] border border-dashed transition-colors w-full',
            verifying ? 'border-[#84CC16]/30 bg-[#84CC16]/5 cursor-wait' : 'border-[#27272A] bg-[#111113] hover:border-[#3F3F46] cursor-pointer',
          )}>
            {verifying ? (
              <><Loader2 className="w-4 h-4 text-[#84CC16] animate-spin" /><span className="text-sm text-[#A1A1AA]">Verifying...</span></>
            ) : (
              <><Upload className="w-4 h-4 text-[#A1A1AA]" /><span className="text-sm text-[#A1A1AA]">Upload verification document</span></>
            )}
          </button>
        )}
      </div>
    </div>
  );


  /* ═══════════════════════════════════════════════════════════════
     Step 1 – Hardware
     ═══════════════════════════════════════════════════════════════ */
  const renderHardware = () => (
    <div className="flex gap-8 flex-col lg:flex-row">
      <div className="space-y-6 flex-1 max-w-lg">
        <div>
          <h2 className="text-lg font-semibold text-[#FAFAFA] mb-1">Hardware Configuration</h2>
          <p className="text-sm text-[#A1A1AA]">Describe the GPU node you&apos;re listing.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#A1A1AA]">GPU Model</label>
          <Select value={gpuModel} onValueChange={v => setGpuModel(v as GPUModel)}>
            <SelectTrigger className="w-full bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] rounded-[6px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1F1F23] border-[#3F3F46]">
              {GPU_MODELS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#A1A1AA]">GPU Count</label>
          <Select value={String(gpuCount)} onValueChange={v => setGpuCount(Number(v))}>
            <SelectTrigger className="w-full bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] rounded-[6px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1F1F23] border-[#3F3F46]">
              {GPU_COUNTS.map(c => (
                <SelectItem key={c} value={String(c)}>{c}× GPU ({c * VRAM_MAP[gpuModel]} GB VRAM)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#A1A1AA]">Interconnect</label>
          <Select value={interconnect} onValueChange={v => setInterconnect(v as Interconnect)}>
            <SelectTrigger className="w-full bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] rounded-[6px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1F1F23] border-[#3F3F46]">
              {INTERCONNECTS.map(ic => (
                <SelectItem key={ic} value={ic}>
                  {ic === 'pcie' ? 'PCIe Only' : ic === 'nvlink-bridge' ? 'NVLink Bridge' : ic === 'nvswitch' ? 'NVSwitch' : 'NVSwitch (NVLink 5)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A1A1AA]">Host Configuration</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-[#A1A1AA]">CPU Model</span>
              <Input value={cpuModel} onChange={e => setCpuModel(e.target.value)}
                className="bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] rounded-[6px] font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-[#A1A1AA]">vCPUs</span>
              <Input value={vcpus} onChange={e => setVcpus(e.target.value)}
                className="bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] rounded-[6px] font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-[#A1A1AA]">RAM (GB)</span>
              <Input value={ramGb} onChange={e => setRamGb(e.target.value)}
                className="bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] rounded-[6px] font-mono text-xs" />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-[#A1A1AA]">NVMe (TB)</span>
              <Input value={nvmeTb} onChange={e => setNvmeTb(e.target.value)}
                className="bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] rounded-[6px] font-mono text-xs" />
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-xs text-[#A1A1AA]">Network (Gbps)</span>
              <Input value={netGbps} onChange={e => setNetGbps(e.target.value)}
                className="bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] rounded-[6px] font-mono text-xs" />
            </div>
          </div>
        </div>

        {/* Slicing Toggle — in main form area so it's always visible */}
        {gpuCount >= 4 && (interconnect === 'nvswitch' || interconnect === 'nvswitch-nvlink5') && (
          <div className="rounded-[10px] border border-[#1F1F23] bg-[#111113] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-[#FAFAFA]">Allow Sliced Access</h3>
                <p className="text-[11px] text-[#A1A1AA] mt-0.5">Let Nava create vGPU and slice offerings from your hardware</p>
              </div>
              <button
                type="button"
                onClick={() => setAllowSlicing(!allowSlicing)}
                className={cn(
                  'relative h-5 w-9 rounded-full border transition-colors shrink-0',
                  allowSlicing ? 'bg-[#84CC16] border-[#84CC16]' : 'bg-[#18181B] border-[#27272A]'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                  allowSlicing && 'translate-x-4'
                )} />
              </button>
            </div>
            {allowSlicing && (
              <div className="pt-3 border-t border-[#1F1F23] space-y-2">
                <p className="text-[10px] text-[#A1A1AA]">
                  Your {gpuCount}x {gpuModel} will also be listed as:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[1, 2, 4].filter(c => c < gpuCount).map(c => (
                    <div key={c} className="flex items-center justify-between px-2 py-1.5 rounded bg-[#18181B] border border-[#27272A]">
                      <span className="text-[#FAFAFA]">{c}x {gpuModel}</span>
                      <span className="text-[#3B82F6] font-mono text-[10px]">vGPU</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-2 py-1.5 rounded bg-[#18181B] border border-[#27272A]">
                    <span className="text-[#FAFAFA]">{Math.floor(VRAM_MAP[gpuModel] / 2)}GB</span>
                    <span className="text-[#A855F7] font-mono text-[10px]">Slice</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#71717A]">
                  Same earnings for you. Nava handles VM orchestration and charges renters a small platform fee.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Topology preview */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="rounded-[10px] border border-[#1F1F23] bg-[#111113] p-6 w-full max-w-sm">
          <h3 className="text-sm font-medium text-[#A1A1AA] mb-4">Topology Preview</h3>
          <TopologyDiagram gpuCount={gpuCount} interconnect={interconnect} showLabels />
          <div className="mt-4 pt-4 border-t border-[#1F1F23] space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#A1A1AA]">Model</span>
              <span className="text-[#FAFAFA] font-mono">{gpuModel}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A1A1AA]">Total VRAM</span>
              <span className="text-[#FAFAFA] font-mono">{gpuCount * VRAM_MAP[gpuModel]} GB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A1A1AA]">Interconnect</span>
              <span className="text-[#FAFAFA] font-mono">{interconnect}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );


  /* ═══════════════════════════════════════════════════════════════
     Step 2 – Install Agent
     ═══════════════════════════════════════════════════════════════ */
  const handleAgentInstall = () => {
    setAgentInstalling(true);
    setTimeout(() => {
      setAgentInstalling(false);
      setAgentInstalled(true);
    }, 2500);
  };

  const renderInstallAgent = () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-[#FAFAFA] mb-1">Install Nava Agent</h2>
        <p className="text-sm text-[#A1A1AA]">
          Install the Nava agent on your hardware. It handles diagnostics, capacity management, image provisioning, and health monitoring.
        </p>
      </div>

      {/* What the agent does */}
      <div className="rounded-[10px] border border-[#1F1F23] bg-[#18181B] p-4 space-y-3">
        <h3 className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wide">The agent handles</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: 'Hardware diagnostics', desc: 'GPU detection, NCCL benchmarks, NVLink tests' },
            { title: 'Capacity management', desc: 'Tracks availability, manages rental scheduling' },
            { title: 'Image provisioning', desc: 'Flashes OS images, injects SSH keys for renters' },
            { title: 'Health monitoring', desc: 'GPU temps, ECC errors, heartbeat reporting' },
          ].map(item => (
            <div key={item.title} className="space-y-0.5">
              <p className="text-sm text-[#FAFAFA]">{item.title}</p>
              <p className="text-xs text-[#A1A1AA]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Installation command */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wide">1. Run on your node</h3>
        <div className="rounded-[6px] border border-[#1F1F23] bg-[#0A0A0C] p-4 overflow-x-auto">
          <pre className="font-mono text-xs text-[#A1A1AA] leading-relaxed">
{`curl -fsSL https://get.nava.dev/agent | bash -s -- \\
  --token ${agentToken} \\
  --node-id $(hostname)`}
          </pre>
        </div>
      </div>

      {/* Token */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wide">2. Your agent token</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-[6px] border border-[#3F3F46] bg-[#18181B] px-3 py-2">
            <span className="font-mono text-xs text-[#FAFAFA]">{agentToken}</span>
          </div>
          <button className="px-3 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] text-xs font-medium rounded-[6px] transition-colors">
            Copy
          </button>
        </div>
        <p className="text-[10px] text-[#A1A1AA]">This token authenticates your node with the Nava platform. Keep it secret.</p>
      </div>

      {/* Requirements */}
      <div className="rounded-[10px] border border-[#1F1F23] bg-[#18181B] p-4 space-y-2">
        <h3 className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wide">Requirements</h3>
        <div className="space-y-1.5 text-xs text-[#A1A1AA]">
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#A1A1AA]" />
            <span>Linux (Ubuntu 20.04+, RHEL 8+, or Debian 11+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#A1A1AA]" />
            <span>NVIDIA driver 525+ with nvidia-smi accessible</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#A1A1AA]" />
            <span>Root or sudo access for image provisioning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#A1A1AA]" />
            <span>Outbound HTTPS (port 443) to api.nava.dev</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-[#A1A1AA]" />
            <span>SSH server running on a public IP or DDNS hostname</span>
          </div>
        </div>
      </div>

      {/* Verify connection */}
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wide">3. Verify connection</h3>
        {!agentInstalled && !agentInstalling && (
          <button
            onClick={handleAgentInstall}
            className="px-4 py-2.5 bg-[#84CC16] text-[#0A0A0B] text-sm font-medium rounded-[6px] hover:bg-[#84CC16]/90 transition-colors"
          >
            Check agent connection
          </button>
        )}
        {agentInstalling && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-[6px] border border-[#27272A] bg-[#18181B]">
            <Loader2 className="w-4 h-4 text-[#84CC16] animate-spin" />
            <span className="text-sm text-[#A1A1AA]">Waiting for agent heartbeat...</span>
          </div>
        )}
        {agentInstalled && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-[6px] border border-[#84CC16]/30 bg-[#84CC16]/5">
            <Check className="w-4 h-4 text-[#84CC16]" />
            <div>
              <span className="text-sm text-[#84CC16] font-medium">Agent connected</span>
              <p className="text-xs text-[#A1A1AA] mt-0.5">Version 1.4.2 · Last heartbeat: just now · GPUs detected: {gpuCount}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );


  /* ═══════════════════════════════════════════════════════════════
     Step 3 – Diagnostics
     ═══════════════════════════════════════════════════════════════ */
  const renderDiagnostics = () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-[#FAFAFA] mb-1">Hardware Diagnostics</h2>
        <p className="text-sm text-[#A1A1AA]">Run the Nava verification agent to benchmark your hardware.</p>
      </div>

      {!diagRunning && !diagComplete && (
        <Button onClick={runDiagnostics}
          className="bg-[#84CC16] text-[#0A0A0B] hover:bg-[#84CC16]/90 rounded-[6px] font-medium">
          Run Diagnostics Agent
        </Button>
      )}

      {(diagRunning || diagComplete) && (
        <div className="flex gap-3 flex-wrap">
          {DIAG_STAGES.map((stage, i) => (
            <div key={stage.label} className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-[6px] text-xs font-medium border',
              i <= diagStage ? 'border-[#84CC16]/30 bg-[#84CC16]/10 text-[#84CC16]' : 'border-[#27272A] text-[#A1A1AA]',
            )}>
              {i < diagStage || diagComplete ? <Check className="w-3 h-3" />
                : i === diagStage && diagRunning ? <Loader2 className="w-3 h-3 animate-spin" />
                : <span className="w-3 h-3 rounded-full border border-current" />}
              <span className="hidden sm:inline">{stage.label}</span>
            </div>
          ))}
        </div>
      )}

      {(diagRunning || diagComplete) && (
        <div ref={termRef}
          className="rounded-[10px] border border-[#1F1F23] bg-[#0A0A0B] p-4 h-64 overflow-y-auto font-mono text-xs leading-relaxed">
          {diagLines.map((line, i) => (
            <div key={i} className={cn(
              line.startsWith('──') ? 'text-[#84CC16] font-semibold mt-2' :
              line.startsWith('✓') ? 'text-[#84CC16] font-semibold mt-2' : 'text-[#A1A1AA]',
            )}>{line}</div>
          ))}
          {diagRunning && <span className="inline-block w-2 h-4 bg-[#84CC16] animate-pulse ml-1" />}
        </div>
      )}

      {diagComplete && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-[10px] border border-[#84CC16]/20 bg-[#84CC16]/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Check className="w-4 h-4 text-[#84CC16]" />
            <h3 className="text-sm font-semibold text-[#84CC16]">Verification Report</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'NCCL Bus BW', value: '238.4 GB/s' },
              { label: 'GEMM TFLOPS', value: '989.2' },
              { label: 'MFU', value: '71.3%' },
              { label: 'HBM BW', value: '3.35 TB/s' },
            ].map(stat => (
              <div key={stat.label} className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA]">{stat.label}</span>
                <p className="text-lg font-mono font-semibold text-[#FAFAFA]">{stat.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tier Education */}
      {diagComplete && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-[10px] border border-[#1F1F23] bg-[#111113] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#FAFAFA]">Your Supplier Tier</h3>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-[6px] border border-[#CD7F32]/40 bg-[#CD7F32]/10 text-[#CD7F32] text-sm font-semibold">Bronze</span>
            <span className="text-sm text-[#A1A1AA]">Starting tier for new providers</span>
          </div>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            All new providers start at Bronze tier. Your tier determines your pricing multiplier and visibility on the marketplace.
            Higher tiers earn significantly more per hour for the same hardware.
          </p>
          <div className="space-y-2 pt-3 border-t border-[#1F1F23]">
            <p className="text-[10px] uppercase tracking-wide text-[#A1A1AA] font-medium">How to upgrade</p>
            <div className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="text-[#C0C0C0] text-xs font-mono w-14 shrink-0">Silver</span>
                <span className="text-xs text-[#A1A1AA]">50+ completed rentals, 99.9% uptime over 30 days, response time under 15 min</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#FFD700] text-xs font-mono w-14 shrink-0">Gold</span>
                <span className="text-xs text-[#A1A1AA]">200+ rentals, 99.95% uptime, response time under 5 min, zero ECC errors</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#E5E4E2] text-xs font-mono w-14 shrink-0">Platinum</span>
                <span className="text-xs text-[#A1A1AA]">500+ rentals, 99.99% uptime, response time under 2 min, hardware redundancy</span>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 pt-3 border-t border-[#1F1F23]">
            <p className="text-[10px] uppercase tracking-wide text-[#A1A1AA] font-medium">Pricing impact</p>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center">
                <span className="text-[10px] text-[#CD7F32]">Bronze</span>
                <p className="font-mono text-xs text-[#FAFAFA]">-15%</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-[#C0C0C0]">Silver</span>
                <p className="font-mono text-xs text-[#FAFAFA]">Base</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-[#FFD700]">Gold</span>
                <p className="font-mono text-xs text-[#FAFAFA]">+12%</p>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-[#E5E4E2]">Platinum</span>
                <p className="font-mono text-xs text-[#FAFAFA]">+25%</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );


  /* ═══════════════════════════════════════════════════════════════
     Step 3 – Availability
     ═══════════════════════════════════════════════════════════════ */
  const renderAvailability = () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-[#FAFAFA] mb-1">Availability</h2>
        <p className="text-sm text-[#A1A1AA]">Set when your hardware is available for rent.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#A1A1AA]">Schedule Mode</label>
        <div className="flex gap-2">
          {([
            { value: 'always', label: 'Always On' },
            { value: 'windowed', label: 'Windowed' },
            { value: 'specific', label: 'Specific Dates' },
          ] as const).map(mode => (
            <button key={mode.value} onClick={() => setScheduleMode(mode.value)} className={cn(
              'px-4 py-2 rounded-[6px] text-sm font-medium border transition-colors',
              scheduleMode === mode.value
                ? 'border-[#84CC16]/50 bg-[#84CC16]/10 text-[#84CC16]'
                : 'border-[#27272A] bg-[#111113] text-[#A1A1AA] hover:border-[#3F3F46]',
            )}>{mode.label}</button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#A1A1AA]">Minimum Rental Duration</label>
        <div className="flex gap-2">
          {DURATION_CHIPS.map(chip => (
            <button key={chip.value} onClick={() => setMinDuration(chip.value)} className={cn(
              'px-4 py-2 rounded-[6px] text-sm font-mono font-medium border transition-colors',
              minDuration === chip.value
                ? 'border-[#84CC16]/50 bg-[#84CC16]/10 text-[#84CC16]'
                : 'border-[#27272A] bg-[#111113] text-[#A1A1AA] hover:border-[#3F3F46]',
            )}>{chip.label}</button>
          ))}
        </div>
      </div>

      {scheduleMode === 'windowed' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A1A1AA]">Weekly Schedule</label>
          <div className="rounded-[10px] border border-[#1F1F23] bg-[#111113] p-4 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="flex">
                <div className="w-12 shrink-0" />
                {HOURS.map(h => (
                  <div key={h} className="flex-1 text-center text-[9px] font-mono text-[#A1A1AA]">
                    {h.toString().padStart(2, '0')}
                  </div>
                ))}
              </div>
              {DAYS.map((day, di) => (
                <div key={day} className="flex items-center mt-0.5">
                  <div className="w-12 shrink-0 text-xs text-[#A1A1AA] font-medium">{day}</div>
                  {HOURS.map(h => (
                    <button key={h} onClick={() => toggleGridCell(di, h)} className={cn(
                      'flex-1 h-5 border border-[#0A0A0B] transition-colors',
                      weeklyGrid[di][h] ? 'bg-[#84CC16]/30 hover:bg-[#84CC16]/40' : 'bg-[#18181B] hover:bg-[#27272A]',
                    )} />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-[#A1A1AA]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#84CC16]/30" /><span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-[#18181B]" /><span>Unavailable</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );


  /* ═══════════════════════════════════════════════════════════════
     Step 4 – Pricing
     ═══════════════════════════════════════════════════════════════ */
  const renderPricing = () => (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-[#FAFAFA] mb-1">Pricing</h2>
        <p className="text-sm text-[#A1A1AA]">Set your pricing strategy.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#A1A1AA]">Pricing Mode</label>
        <div className="flex gap-2">
          {([
            { value: 'manual', label: 'Manual', desc: 'Set your own rates' },
            { value: 'auto', label: 'Auto-price', desc: 'Dynamic market pricing' },
          ] as const).map(mode => (
            <button key={mode.value} onClick={() => setPricingMode(mode.value)} className={cn(
              'flex-1 px-4 py-3 rounded-[10px] text-left border transition-colors',
              pricingMode === mode.value
                ? 'border-[#84CC16]/50 bg-[#84CC16]/10'
                : 'border-[#27272A] bg-[#111113] hover:border-[#3F3F46]',
            )}>
              <span className={cn('text-sm font-medium block',
                pricingMode === mode.value ? 'text-[#84CC16]' : 'text-[#A1A1AA]')}>{mode.label}</span>
              <span className="text-xs text-[#A1A1AA]">{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {pricingMode === 'manual' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#A1A1AA]">Hourly Rate ($/hr)</label>
            <Input type="number" step="0.01" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)}
              className="bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] rounded-[6px] font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A1A1AA]">Daily Discount (%)</label>
              <Input type="number" value={dailyDiscount} onChange={e => setDailyDiscount(e.target.value)}
                className="bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] rounded-[6px] font-mono" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#A1A1AA]">Weekly Discount (%)</label>
              <Input type="number" value={weeklyDiscount} onChange={e => setWeeklyDiscount(e.target.value)}
                className="bg-[#18181B] border-[#3F3F46] text-[#FAFAFA] rounded-[6px] font-mono" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="text-sm font-medium text-[#A1A1AA]">
            Floor Price: <span className="font-mono text-[#FAFAFA]">${floorPrice[0].toFixed(2)}/hr</span>
          </label>
          <Slider value={floorPrice} onValueChange={v => setFloorPrice(v as number[])}
            min={0.5} max={10} step={0.1} className="w-full" />
          <div className="flex justify-between text-[10px] font-mono text-[#A1A1AA]">
            <span>$0.50</span><span>$10.00</span>
          </div>
        </div>
      )}

      <div className="rounded-[10px] border border-[#1F1F23] bg-[#111113] p-5 space-y-3">
        <h3 className="text-sm font-medium text-[#A1A1AA]">Revenue Projection</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA]">Effective Rate</span>
            <p className="text-lg font-mono font-semibold text-[#FAFAFA]">${effectiveRate.toFixed(2)}/hr</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA]">Utilization</span>
            <p className="text-lg font-mono font-semibold text-[#84CC16]">{projectedUtilization}%</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA]">Weekly Revenue</span>
            <p className="text-lg font-mono font-semibold text-[#FAFAFA]">${weeklyRevenue}</p>
          </div>
        </div>
      </div>

      {/* Tier Pricing Dynamics */}
      <TierPricingChart basePrice={effectiveRate} />
    </div>
  );


  /* ═══════════════════════════════════════════════════════════════
     Step 5 – Review & Publish
     ═══════════════════════════════════════════════════════════════ */
  const renderReview = () => {
    if (published) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#84CC16]/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-[#84CC16]" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-[#FAFAFA]">Listing Published!</h2>
            <p className="text-sm text-[#A1A1AA]">Your GPU node is now live on the Nava marketplace.</p>
          </div>
          <Button onClick={() => router.push('/app/supply')}
            className="bg-[#84CC16] text-[#0A0A0B] hover:bg-[#84CC16]/90 rounded-[6px] font-medium px-6">
            Go to Dashboard
          </Button>
        </motion.div>
      );
    }

    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-lg font-semibold text-[#FAFAFA] mb-1">Review &amp; Publish</h2>
          <p className="text-sm text-[#A1A1AA]">Review your listing before going live.</p>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox checked={autoWipe} onCheckedChange={v => setAutoWipe(v === true)} />
          <div>
            <span className="text-sm text-[#FAFAFA]">Auto-wipe after each rental</span>
            <p className="text-xs text-[#A1A1AA]">Securely erase all tenant data when a rental ends.</p>
          </div>
        </div>

        {/* Listing preview card */}
        <div className="rounded-[10px] border border-[#1F1F23] bg-[#111113] p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#FAFAFA]">Listing Preview</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#84CC16]/10 text-[#84CC16] text-[10px] font-medium uppercase tracking-wider">Draft</span>
          </div>

          {/* Provider */}
          <div className="space-y-2 pb-4 border-b border-[#1F1F23]">
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA]">Provider</span>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#18181B] border border-[#27272A] flex items-center justify-center text-xs font-mono text-[#84CC16]">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[#FAFAFA]">{displayName || '—'}</p>
                <p className="text-xs text-[#A1A1AA]">{providerType} · {location || '—'}</p>
              </div>
              {verified && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-[#84CC16]/10 text-[#84CC16] text-[10px] font-medium">Verified</span>
              )}
            </div>
          </div>

          {/* Hardware */}
          <div className="space-y-2 pb-4 border-b border-[#1F1F23]">
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA]">Hardware</span>
            <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
              {[
                ['GPU', `${gpuCount}× ${gpuModel}`],
                ['VRAM', `${gpuCount * VRAM_MAP[gpuModel]} GB`],
                ['Interconnect', interconnect],
                ['CPU', cpuModel],
                ['vCPUs', vcpus],
                ['RAM', `${ramGb} GB`],
                ['NVMe', `${nvmeTb} TB`],
                ['Network', `${netGbps} Gbps`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[#A1A1AA]">{k}</span>
                  <span className="font-mono text-[#FAFAFA]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2 pb-4 border-b border-[#1F1F23]">
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA]">Availability</span>
            <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Schedule</span>
                <span className="font-mono text-[#FAFAFA] capitalize">{scheduleMode === 'always' ? 'Always On' : scheduleMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Min Duration</span>
                <span className="font-mono text-[#FAFAFA]">{minDuration}</span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-2 pb-4 border-b border-[#1F1F23]">
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA]">Pricing</span>
            <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Mode</span>
                <span className="font-mono text-[#FAFAFA] capitalize">{pricingMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Rate</span>
                <span className="font-mono text-[#FAFAFA]">${effectiveRate.toFixed(2)}/hr</span>
              </div>
              {pricingMode === 'manual' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#A1A1AA]">Daily Discount</span>
                    <span className="font-mono text-[#FAFAFA]">{dailyDiscount}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#A1A1AA]">Weekly Discount</span>
                    <span className="font-mono text-[#FAFAFA]">{weeklyDiscount}%</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Policies */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-[#A1A1AA]">Policies</span>
            <div className="text-sm">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Auto-wipe</span>
                <span className="font-mono text-[#FAFAFA]">{autoWipe ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handlePublish} disabled={publishing}
          className="w-full bg-[#84CC16] text-[#0A0A0B] hover:bg-[#84CC16]/90 rounded-[6px] font-semibold h-11 text-base">
          {publishing ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />Publishing...</>
          ) : 'Publish Listing'}
        </Button>
      </div>
    );
  };


  /* ═══════════════════════════════════════════════════════════════
     Main Layout
     ═══════════════════════════════════════════════════════════════ */
  const stepRenderers = [
    renderProviderProfile,
    renderHardware,
    renderInstallAgent,
    renderDiagnostics,
    renderAvailability,
    renderPricing,
    renderReview,
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#FAFAFA]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#FAFAFA]">List Your Hardware</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        {renderProgressStrip()}

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {stepRenderers[step]()}
            </motion.div>
          </AnimatePresence>
        </div>

        {!published && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#1F1F23]">
            <Button onClick={goBack} disabled={step === 0} variant="ghost"
              className="text-[#A1A1AA] hover:text-[#FAFAFA] rounded-[6px] disabled:opacity-30">
              <ArrowLeft className="w-4 h-4 mr-1.5" />Back
            </Button>
            {step < STEPS.length - 1 && (
              <Button onClick={goNext} disabled={!canContinue()} className={cn(
                'rounded-[6px] font-medium',
                canContinue()
                  ? 'bg-[#84CC16] text-[#0A0A0B] hover:bg-[#84CC16]/90'
                  : 'bg-[#27272A] text-[#A1A1AA] cursor-not-allowed',
              )}>
                Continue<ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
