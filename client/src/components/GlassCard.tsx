import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, variant = 'default', hover = false, className = '', onClick }: GlassCardProps) {
  const variantClasses = {
    default: 'glass-card',
    elevated: 'glass-card bg-bg-elevated/80',
    bordered: 'glass-card border-brand-indigo/20',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${hover ? 'glass-card-hover cursor-pointer' : ''} p-6 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
