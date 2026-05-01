'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Interconnect } from '@/lib/types';

interface TopologyDiagramProps {
  gpuCount: number;
  interconnect: Interconnect;
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
}

/**
 * Renders a physically accurate topology diagram based on real NVIDIA interconnect architectures:
 *
 * - NVSwitch (H100 SXM, A100 SXM): 8 GPUs connected through NVSwitch chips (star/crossbar topology).
 *   Each GPU connects to every NVSwitch, and each NVSwitch connects to every GPU = full bisection bandwidth.
 *
 * - NVSwitch NVLink 5 (B200): Same as NVSwitch but with NVLink 5.0 at 1800 GB/s per GPU.
 *
 * - NVLink Bridge (A100 PCIe): 2 GPUs connected point-to-point via a physical NVLink bridge.
 *
 * - PCIe (H100 PCIe, L40S, RTX 4090, RTX 6000 Ada): GPUs on a shared PCIe bus via CPU root complex.
 *   No direct GPU-to-GPU link. All traffic goes through CPU/PCIe switch.
 */
export function TopologyDiagram({
  gpuCount,
  interconnect,
  className,
  showLabels = true,
  compact = false,
}: TopologyDiagramProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const w = compact ? 140 : 360;
  const h = compact ? 90 : 220;
  const gpuW = compact ? 18 : 36;
  const gpuH = compact ? 14 : 24;
  const pad = compact ? 10 : 20;

  const bandwidthLabel = {
    'pcie': 'PCIe',
    'nvlink-bridge': '600 GB/s',
    'nvswitch': '900 GB/s',
    'nvswitch-nvlink5': '1.8 TB/s',
  }[interconnect];

  // GPU positions
  const gpuPositions = (() => {
    const positions: { x: number; y: number }[] = [];

    if (interconnect === 'nvswitch' || interconnect === 'nvswitch-nvlink5') {
      // NVSwitch: GPUs in a row at the bottom, NVSwitch chips above
      const gpuY = h - pad - gpuH;
      const totalGpuWidth = gpuCount * gpuW + (gpuCount - 1) * (compact ? 2 : 6);
      const startX = (w - totalGpuWidth) / 2;
      for (let i = 0; i < gpuCount; i++) {
        positions.push({ x: startX + i * (gpuW + (compact ? 2 : 6)), y: gpuY });
      }
    } else if (interconnect === 'nvlink-bridge') {
      // NVLink bridge: 2 GPUs side by side with a bridge between them
      const gap = compact ? 30 : 80;
      const startX = (w - 2 * gpuW - gap) / 2;
      const y = h / 2 - gpuH / 2;
      positions.push({ x: startX, y });
      positions.push({ x: startX + gpuW + gap, y });
    } else {
      // PCIe: GPUs in a row at the bottom, CPU/PCIe switch above
      const gpuY = h - pad - gpuH;
      const maxPerRow = compact ? 4 : 8;
      const rows = Math.ceil(gpuCount / maxPerRow);
      const perRow = Math.ceil(gpuCount / rows);
      for (let i = 0; i < gpuCount; i++) {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const rowCount = Math.min(perRow, gpuCount - row * perRow);
        const totalRowWidth = rowCount * gpuW + (rowCount - 1) * (compact ? 4 : 8);
        const startX = (w - totalRowWidth) / 2;
        positions.push({
          x: startX + col * (gpuW + (compact ? 4 : 8)),
          y: gpuY - row * (gpuH + (compact ? 8 : 20)),
        });
      }
    }
    return positions;
  })();

  // NVSwitch chip positions (for nvswitch topologies)
  const nvswitchPositions = (() => {
    if (interconnect !== 'nvswitch' && interconnect !== 'nvswitch-nvlink5') return [];
    const count = interconnect === 'nvswitch-nvlink5' ? 4 : interconnect === 'nvswitch' ? 4 : 0;
    const switchY = pad + (compact ? 4 : 10);
    const switchW = compact ? 12 : 24;
    const totalWidth = count * switchW + (count - 1) * (compact ? 8 : 20);
    const startX = (w - totalWidth) / 2;
    return Array.from({ length: count }, (_, i) => ({
      x: startX + i * (switchW + (compact ? 8 : 20)),
      y: switchY,
      w: switchW,
      h: compact ? 8 : 16,
    }));
  })();

  // CPU position (for PCIe topology)
  const cpuPosition = (interconnect === 'pcie') ? {
    x: w / 2 - (compact ? 20 : 40),
    y: pad + (compact ? 2 : 8),
    w: compact ? 40 : 80,
    h: compact ? 10 : 20,
  } : null;

  return (
    <div className={cn('relative', className)}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        {mounted && (
          <>
            {/* === NVSwitch topology === */}
            {(interconnect === 'nvswitch' || interconnect === 'nvswitch-nvlink5') && (
              <>
                {/* Lines from each GPU to each NVSwitch */}
                {gpuPositions.map((gpu, gi) =>
                  nvswitchPositions.map((sw, si) => (
                    <motion.line
                      key={`link-${gi}-${si}`}
                      x1={gpu.x + gpuW / 2} y1={gpu.y}
                      x2={sw.x + sw.w / 2} y2={sw.y + sw.h}
                      stroke={interconnect === 'nvswitch-nvlink5' ? '#84CC16' : '#84CC16'}
                      strokeWidth={compact ? 0.5 : 1}
                      strokeOpacity={0.6}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: gi * 0.02 + si * 0.02 }}
                    />
                  ))
                )}
                {/* NVSwitch chips */}
                {nvswitchPositions.map((sw, i) => (
                  <motion.g key={`sw-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    <rect x={sw.x} y={sw.y} width={sw.w} height={sw.h} rx={compact ? 1 : 3}
                      className="fill-elevated" stroke="#84CC16" strokeWidth={compact ? 0.5 : 1} />
                    {!compact && (
                      <text x={sw.x + sw.w / 2} y={sw.y + sw.h / 2} textAnchor="middle" dominantBaseline="middle"
                        className="fill-accent text-[7px] font-mono">SW{i}</text>
                    )}
                  </motion.g>
                ))}
              </>
            )}

            {/* === NVLink Bridge topology === */}
            {interconnect === 'nvlink-bridge' && gpuPositions.length === 2 && (
              <>
                {/* Bridge connection */}
                <motion.line
                  x1={gpuPositions[0].x + gpuW} y1={gpuPositions[0].y + gpuH / 2}
                  x2={gpuPositions[1].x} y2={gpuPositions[1].y + gpuH / 2}
                  stroke="#84CC16" strokeWidth={compact ? 1.5 : 3}
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5 }}
                />
                {/* Bridge label */}
                {!compact && showLabels && (
                  <motion.text
                    x={w / 2} y={gpuPositions[0].y + gpuH / 2 - 8}
                    textAnchor="middle" className="fill-accent text-[8px] font-mono"
                    initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.5 }}
                  >
                    NVLink Bridge
                  </motion.text>
                )}
              </>
            )}

            {/* === PCIe topology === */}
            {interconnect === 'pcie' && cpuPosition && (
              <>
                {/* Lines from CPU to each GPU */}
                {gpuPositions.map((gpu, i) => (
                  <motion.line
                    key={`pcie-${i}`}
                    x1={cpuPosition.x + cpuPosition.w / 2} y1={cpuPosition.y + cpuPosition.h}
                    x2={gpu.x + gpuW / 2} y2={gpu.y}
                    stroke="#A1A1AA" strokeWidth={compact ? 0.5 : 1}
                    strokeDasharray={compact ? '2,2' : '4,3'}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  />
                ))}
                {/* CPU block */}
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
                  <rect x={cpuPosition.x} y={cpuPosition.y} width={cpuPosition.w} height={cpuPosition.h}
                    rx={compact ? 1 : 3} className="fill-elevated" stroke="#A1A1AA" strokeWidth={compact ? 0.5 : 1} />
                  {!compact && (
                    <text x={cpuPosition.x + cpuPosition.w / 2} y={cpuPosition.y + cpuPosition.h / 2}
                      textAnchor="middle" dominantBaseline="middle" className="fill-tertiary text-[8px] font-mono">
                      PCIe Switch
                    </text>
                  )}
                </motion.g>
              </>
            )}

            {/* === GPU nodes (all topologies) === */}
            {gpuPositions.map((pos, i) => (
              <motion.g key={`gpu-${i}`} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}>
                <rect x={pos.x} y={pos.y} width={gpuW} height={gpuH} rx={compact ? 2 : 4}
                  className="fill-elevated"
                  stroke={interconnect === 'pcie' ? '#A1A1AA' : '#84CC16'}
                  strokeWidth={compact ? 0.5 : 1.5} />
                {!compact && (
                  <text x={pos.x + gpuW / 2} y={pos.y + gpuH / 2} textAnchor="middle" dominantBaseline="middle"
                    className="fill-primary text-[9px] font-mono font-medium">{i}</text>
                )}
              </motion.g>
            ))}
          </>
        )}
      </svg>

      {showLabels && !compact && (
        <div className="mt-2 flex items-center gap-4 text-xs text-tertiary">
          <div className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded border', 'border-accent bg-elevated')} />
            <span>GPU</span>
          </div>
          {(interconnect === 'nvswitch' || interconnect === 'nvswitch-nvlink5') && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm border border-accent bg-elevated" />
              <span>NVSwitch</span>
            </div>
          )}
          {interconnect === 'pcie' && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0 border-t border-dashed border-[#3F3F46]" />
              <span>PCIe</span>
            </div>
          )}
          <span className="font-mono text-[10px] text-secondary">{bandwidthLabel}/GPU</span>
        </div>
      )}
    </div>
  );
}
