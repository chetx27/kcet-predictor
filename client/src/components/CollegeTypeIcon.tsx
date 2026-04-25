import type { CollegeType } from '../../../shared/types';

interface CollegeTypeIconProps {
  type: CollegeType;
  className?: string;
}

const config: Record<CollegeType, { color: string; label: string }> = {
  government: { color: 'text-status-safe', label: 'Govt' },
  aided: { color: 'text-status-info', label: 'Aided' },
  private: { color: 'text-status-moderate', label: 'Private' },
};

export function CollegeTypeIcon({ type, className = '' }: CollegeTypeIconProps) {
  const { color, label } = config[type] || config.private;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color} ${className}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-4h6v4" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
        <path d="M9 14h.01" />
        <path d="M15 14h.01" />
      </svg>
      {label}
    </span>
  );
}
