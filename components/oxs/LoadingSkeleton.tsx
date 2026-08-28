type LoadingSkeletonProps = {
  rows?: number;
};

export function LoadingSkeleton({ rows = 3 }: LoadingSkeletonProps) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-20 animate-pulse rounded-2xl border border-white/5 bg-white/5" />
      ))}
    </div>
  );
}
