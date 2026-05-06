import { cn } from '@/lib/utils';
import { TrustTier, SUPPLIER_TIERS } from '@/lib/types';

interface TrustBadgeProps {
  tier: TrustTier;
  className?: string;
  showLabel?: boolean;
}

/** @deprecated Use SupplierTierBadge instead */
export function TrustBadge({ tier, className, showLabel = true }: TrustBadgeProps) {
  const config = SUPPLIER_TIERS[tier];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
        config.bgColor,
        config.borderColor,
        config.color,
        className
      )}
    >
      {showLabel && config.label}
    </span>
  );
}
