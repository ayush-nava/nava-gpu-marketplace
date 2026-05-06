import { cn } from '@/lib/utils';
import { TrustTier, SUPPLIER_TIERS } from '@/lib/types';

interface SupplierTierBadgeProps {
  tier: TrustTier;
  className?: string;
  showSLA?: boolean;
  size?: 'sm' | 'md';
}

export function SupplierTierBadge({ tier, className, showSLA = false, size = 'sm' }: SupplierTierBadgeProps) {
  const config = SUPPLIER_TIERS[tier];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border font-medium',
        config.bgColor,
        config.borderColor,
        config.color,
        size === 'sm' ? 'px-2 py-0.5 rounded text-[10px]' : 'px-2.5 py-1 rounded-md text-xs',
        className
      )}
    >
      <span className="font-semibold">{config.label}</span>
      {showSLA && <span className="opacity-70">{config.uptimeSLA}</span>}
    </span>
  );
}
