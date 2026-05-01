import { cn } from '@/lib/utils';

interface MonoStatProps {
  label: string;
  value: string | number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MonoStat({ label, value, className, size = 'md' }: MonoStatProps) {
  const sizeClasses = {
    sm: { label: 'text-xs', value: 'text-sm' },
    md: { label: 'text-xs', value: 'text-base' },
    lg: { label: 'text-sm', value: 'text-xl' },
  };

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className={cn('text-tertiary', sizeClasses[size].label)}>{label}</span>
      <span className={cn('font-mono text-primary', sizeClasses[size].value)}>{value}</span>
    </div>
  );
}
