'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TelemetryData } from '@/lib/types';

interface TelemetryCardProps {
  data: TelemetryData;
  className?: string;
}

function MiniSparkline({ data, className }: { data: number[]; className?: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 60;

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent"
      />
    </svg>
  );
}

export function TelemetryCard({ data, className }: TelemetryCardProps) {
  const utilColor =
    data.utilization > 90
      ? 'text-danger'
      : data.utilization > 70
      ? 'text-accent'
      : 'text-secondary';

  const tempColor =
    data.temperature > 80
      ? 'text-danger'
      : data.temperature > 70
      ? 'text-warning'
      : 'text-secondary';

  return (
    <div
      className={cn(
        'bg-surface border border-border-subtle rounded-lg p-3 space-y-2',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-tertiary">GPU {data.gpuIndex}</span>
        <MiniSparkline data={data.history} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] text-tertiary uppercase tracking-wide">Util</div>
          <motion.div
            className={cn('font-mono text-lg font-medium', utilColor)}
            key={Math.round(data.utilization)}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Math.round(data.utilization)}%
          </motion.div>
        </div>
        <div>
          <div className="text-[10px] text-tertiary uppercase tracking-wide">VRAM</div>
          <div className="font-mono text-sm text-secondary">
            {data.vramUsed.toFixed(1)}/{data.vramTotal}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-tertiary uppercase tracking-wide">Temp</div>
          <motion.div
            className={cn('font-mono text-sm', tempColor)}
            key={Math.round(data.temperature)}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {Math.round(data.temperature)}C
          </motion.div>
        </div>
        <div>
          <div className="text-[10px] text-tertiary uppercase tracking-wide">Power</div>
          <div className="font-mono text-sm text-secondary">
            {Math.round(data.powerDraw)}W
          </div>
        </div>
      </div>
    </div>
  );
}
