interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return <div className={`skeleton h-4 ${className}`} />;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'} ${className}`}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="w-20 h-6" />
        <Skeleton className="w-16 h-5" />
      </div>
      <Skeleton className="w-3/4 h-6" />
      <Skeleton className="w-1/2 h-4" />
      <div className="pt-4 border-t border-bg-border">
        <Skeleton lines={2} />
      </div>
    </div>
  );
}

export function ResultsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
