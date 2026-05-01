import { cn } from '@/lib/utils';
import { TrustTier } from '@/lib/types';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface TrustBadgeProps {
  tier: TrustTier;
  className?: string;
  showLabel?: boolean;
}

export function TrustBadge({ tier, className, showLabel = true }: TrustBadgeProps) {
  const config = {
    'verified+': {
      icon: ShieldCheck,
      label: 'Verified+',
      classes: 'bg-accent/10 text-accent border-accent/20',
    },
    'verified': {
      icon: Shield,
      label: 'Verified',
      classes: 'bg-info/10 text-info border-info/20',
    },
    'new': {
      icon: ShieldAlert,
      label: 'New',
      classes: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    },
  };

  const { icon: Icon, label, classes } = config[tier];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
        classes,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {showLabel && label}
    </span>
  );
}
