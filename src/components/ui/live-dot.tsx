'use client';

import { cn } from '@/lib/utils';

interface LiveDotProps {
  className?: string;
  color?: 'accent' | 'success' | 'warning' | 'danger';
}

export function LiveDot({ className, color = 'accent' }: LiveDotProps) {
  const colorClasses = {
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };

  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      <span
        className={cn(
          'animate-pulse-dot absolute inline-flex h-full w-full rounded-full opacity-75',
          colorClasses[color]
        )}
      />
      <span
        className={cn(
          'relative inline-flex rounded-full h-2 w-2',
          colorClasses[color]
        )}
      />
    </span>
  );
}
