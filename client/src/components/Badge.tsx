import type { ProbabilityTier } from '../../../shared/types';

interface BadgeProps {
  variant: ProbabilityTier | 'info' | 'quota';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  safe: 'bg-status-safe/10 text-status-safe border-status-safe/20',
  moderate: 'bg-status-moderate/10 text-status-moderate border-status-moderate/20',
  reach: 'bg-status-reach/10 text-status-reach border-status-reach/20',
  info: 'bg-status-info/10 text-status-info border-status-info/20',
  quota: 'bg-brand-indigo/10 text-brand-soft border-brand-indigo/20',
};

export function Badge({ variant, children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${variantStyles[variant] || variantStyles.info} ${className}`}
    >
      {children}
    </span>
  );
}
