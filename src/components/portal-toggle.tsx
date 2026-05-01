'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PortalToggleProps {
  value: 'demand' | 'supply';
  onChange: (value: 'demand' | 'supply') => void;
  className?: string;
}

export function PortalToggle({ value, onChange, className }: PortalToggleProps) {
  return (
    <div
      className={cn(
        'relative flex bg-surface border border-border-default rounded-md p-0.5',
        className
      )}
    >
      <motion.div
        className="absolute top-0.5 bottom-0.5 bg-elevated rounded"
        initial={false}
        animate={{
          left: value === 'demand' ? '2px' : '50%',
          width: 'calc(50% - 4px)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />
      <button
        onClick={() => onChange('demand')}
        className={cn(
          'relative z-10 px-4 py-1.5 text-sm font-medium rounded transition-colors',
          value === 'demand' ? 'text-primary' : 'text-tertiary hover:text-secondary'
        )}
      >
        Demand
      </button>
      <button
        onClick={() => onChange('supply')}
        className={cn(
          'relative z-10 px-4 py-1.5 text-sm font-medium rounded transition-colors',
          value === 'supply' ? 'text-primary' : 'text-tertiary hover:text-secondary'
        )}
      >
        Supply
      </button>
    </div>
  );
}
