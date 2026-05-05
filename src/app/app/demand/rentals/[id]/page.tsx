'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { rentals, listings } from '@/lib/mock';
import { AI_MODELS } from '@/lib/mock/models';
import { useFakeTelemetry } from '@/hooks/use-fake-telemetry';
import { TelemetryCard } from '@/components/telemetry-card';
import { ModelDeployCard } from '@/components/model-deploy-card';
import { CommandSnippet } from '@/components/ui/command-snippet';
import { MonoStat } from '@/components/ui/mono-stat';
import { TerminalLog } from '@/components/ui/terminal-log';
import { TopologyDiagram } from '@/components/topology-diagram';
import { Button } from '@/components/ui/button';

function formatTimeRemaining(endTime: string): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return '00h 00m 00s';
  
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}

export default function ActiveSessionPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const searchParams = useSearchParams();
  const fromListingId = searchParams.get('from');
  const deployedModelId = searchParams.get('model');
  const deployedVariantId = searchParams.get('variant');
  const deployedRuntime = searchParams.get('runtime');
  
  // For rnt-new, look up the actual listing that was reserved
  const sourceListing = fromListingId 
    ? listings.find(l => l.id === fromListingId) 
    : null;

  const rental = id === 'rnt-new' && sourceListing
    ? {
        ...rentals[0],
        id: 'rnt-new',
        listing: sourceListing,
        listingId: sourceListing.id,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 24 * 3600000).toISOString(),
        status: 'active' as const,
        sshHost: '98.51.100.42',
        sshPort: 22,
        sshUser: 'ubuntu',
        sshFingerprint: 'SHA256:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
      }
    : rentals.find(r => r.id === id) || rentals[0];

  const listing = rental.listing;
  const telemetry = useFakeTelemetry(listing.gpu.count, listing.gpu.vramGB, 42);
  
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(rental.endTime));
  const [logs, setLogs] = useState<Array<{ timestamp: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' }>>([
    { timestamp: '14:23:01', message: 'session started', type: 'success' },
    { timestamp: '14:23:01', message: 'ssh daemon ready on port 22', type: 'info' },
    { timestamp: '14:23:02', message: 'nvidia-smi: 8 GPUs detected', type: 'info' },
    { timestamp: '14:23:03', message: 'nccl test passed: 412 GB/s', type: 'success' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(rental.endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [rental.endTime]);

  useEffect(() => {
    const logInterval = setInterval(() => {
      const now = new Date();
      const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const messages = [
        { message: 'heartbeat ok', type: 'info' as const },
        { message: `gpu0 util ${Math.round(telemetry[0]?.utilization || 80)}%`, type: 'info' as const },
        { message: `gpu1 util ${Math.round(telemetry[1]?.utilization || 75)}%`, type: 'info' as const },
        { message: 'network egress: 2.4 Gbps', type: 'info' as const },
        { message: 'nvlink health: nominal', type: 'success' as const },
        { message: 'memory pressure: low', type: 'info' as const },
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      
      setLogs(prev => [...prev.slice(-50), { timestamp, ...randomMessage }]);
    }, 3000);

    return () => clearInterval(logInterval);
  }, [telemetry]);

  const sshCommand = `ssh -i ~/.ssh/nava_ed25519 ${rental.sshUser}@${rental.sshHost} -p ${rental.sshPort}`;

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
      {/* Back link */}
      <Link
        href="/app/demand/rentals"
        className="inline-flex items-center gap-1.5 text-sm text-tertiary hover:text-secondary"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to rentals
      </Link>

      {/* Status Bar */}
      <div className="bg-surface border border-border-subtle rounded-card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-tertiary uppercase tracking-wide mb-1">Configuration</div>
              <div className="font-mono text-primary">
                {listing.gpu.count}x {listing.gpu.model} · {listing.interconnectLabel}
              </div>
            </div>
            <div className="h-8 w-px bg-border-subtle" />
            <div>
              <div className="text-xs text-tertiary uppercase tracking-wide mb-1">Region</div>
              <div className="font-mono text-primary uppercase">{listing.region}</div>
            </div>
            <div className="h-8 w-px bg-border-subtle" />
            <div>
              <div className="text-xs text-tertiary uppercase tracking-wide mb-1">Started</div>
              <div className="font-mono text-primary">
                {new Date(rental.startTime).toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-tertiary uppercase tracking-wide mb-1">Time Remaining</div>
              <div className="font-mono text-2xl text-accent">{timeRemaining}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-border-default text-secondary hover:text-primary">
                Extend
              </Button>
              <Button variant="outline" className="border-danger/50 text-danger hover:bg-danger/10">
                Release
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Deployed Model Card */}
      {deployedModelId && (() => {
        const model = AI_MODELS.find(m => m.id === deployedModelId);
        const variant = model?.variants.find(v => v.id === deployedVariantId);
        if (!model || !variant) return null;
        return (
          <div className="bg-surface border border-accent/30 rounded-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-accent uppercase tracking-wide">Deployed Model</h2>
              <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-mono rounded">Running</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MonoStat label="Model" value={model.name} size="sm" />
              <MonoStat label="Quantization" value={variant.quantization} size="sm" />
              <MonoStat label="Runtime" value={deployedRuntime || 'vllm'} size="sm" />
              <MonoStat label="Weight Size" value={`${variant.sizeGB} GB`} size="sm" />
            </div>
            <div className="pt-3 border-t border-border-subtle">
              <div className="font-mono text-xs text-secondary">
                Endpoint: <span className="text-accent">https://{rental.sshHost}:8000/v1/completions</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SSH Connect Card */}
      <div className="bg-surface border border-border-subtle rounded-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-tertiary uppercase tracking-wide">SSH Connection</h2>
          <button className="flex items-center gap-1.5 text-sm text-accent hover:underline">
            <ExternalLink className="w-3.5 h-3.5" />
            Open in terminal
          </button>
        </div>
        
        <CommandSnippet code={sshCommand} />
        
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border-subtle">
          <MonoStat label="IP Address" value={rental.sshHost} size="sm" />
          <MonoStat label="User" value={rental.sshUser} size="sm" />
          <MonoStat label="Port" value={rental.sshPort.toString()} size="sm" />
          <div>
            <div className="text-xs text-tertiary mb-0.5">Fingerprint</div>
            <div className="font-mono text-xs text-secondary truncate" title={rental.sshFingerprint}>
              {rental.sshFingerprint}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Telemetry Grid */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-tertiary uppercase tracking-wide">Live Telemetry</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {telemetry.map((gpu) => (
              <TelemetryCard key={gpu.gpuIndex} data={gpu} />
            ))}
          </div>

          {/* Activity Log */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-tertiary uppercase tracking-wide">Activity Log</h2>
            <TerminalLog lines={logs} maxHeight="240px" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Topology */}
          <div className="bg-surface border border-border-subtle rounded-card p-4">
            <h3 className="text-xs text-tertiary uppercase tracking-wide mb-3">Topology</h3>
            <TopologyDiagram
              gpuCount={listing.gpu.count}
              interconnect={listing.interconnect}
              showLabels={false}
            />
          </div>

          {/* Quick Stats */}
          <div className="bg-surface border border-border-subtle rounded-card p-4 space-y-3">
            <h3 className="text-xs text-tertiary uppercase tracking-wide">Session Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <MonoStat 
                label="Avg GPU Util" 
                value={`${Math.round(telemetry.reduce((a, b) => a + b.utilization, 0) / telemetry.length)}%`} 
                size="sm" 
              />
              <MonoStat 
                label="Total VRAM" 
                value={`${listing.gpu.count * listing.gpu.vramGB} GB`} 
                size="sm" 
              />
              <MonoStat 
                label="Avg Temp" 
                value={`${Math.round(telemetry.reduce((a, b) => a + b.temperature, 0) / telemetry.length)}C`} 
                size="sm" 
              />
              <MonoStat 
                label="Total Power" 
                value={`${Math.round(telemetry.reduce((a, b) => a + b.powerDraw, 0))}W`} 
                size="sm" 
              />
            </div>
          </div>

          {/* Cost */}
          <div className="bg-surface border border-border-subtle rounded-card p-4 space-y-3">
            <h3 className="text-xs text-tertiary uppercase tracking-wide">Cost</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Rate</span>
                <span className="font-mono text-primary">${listing.pricePerHour.toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Elapsed</span>
                <span className="font-mono text-primary">
                  {Math.round((Date.now() - new Date(rental.startTime).getTime()) / 3600000)}h
                </span>
              </div>
              <div className="pt-2 border-t border-border-subtle flex justify-between">
                <span className="text-secondary">Running total</span>
                <span className="font-mono text-lg text-accent">
                  ${(listing.pricePerHour * Math.max(1, (Date.now() - new Date(rental.startTime).getTime()) / 3600000)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Model Deployment */}
          <div className="space-y-2">
            <h3 className="text-xs text-tertiary uppercase tracking-wide">Model Deployment</h3>
            <ModelDeployCard
              gpuModel={listing.gpu.model}
              gpuCount={listing.gpu.count}
              vramPerGPU={listing.gpu.vramGB}
              pricePerHour={listing.pricePerHour}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
