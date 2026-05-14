import { cn } from "@/lib/utils";

export function SkeletonBone({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-white/10",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className,
      )}
      {...props}
      aria-hidden="true"
    />
  );
}

export function TextSkeleton({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBone
          key={index}
          className={cn(
            "h-3",
            index === lines - 1 ? "w-2/3" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

export function StatSkeleton({ className }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-4", className)}>
      <SkeletonBone className="h-3 w-20" />
      <SkeletonBone className="mt-4 h-8 w-28" />
      <SkeletonBone className="mt-3 h-2 w-full" />
    </div>
  );
}

export function ListSkeleton({ rows = 4, className }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-start gap-3">
            <SkeletonBone className="h-9 w-9 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBone className="h-3 w-3/4" />
              <SkeletonBone className="h-3 w-1/2" />
            </div>
            <SkeletonBone className="h-5 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }) {
  return (
    <div className={cn("flex h-full min-h-[220px] flex-col justify-end gap-3", className)}>
      <div className="grid flex-1 grid-cols-8 items-end gap-2">
        {[55, 78, 42, 64, 88, 58, 72, 48].map((height, index) => (
          <SkeletonBone
            key={index}
            className="w-full rounded-t-lg"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-3">
        <SkeletonBone className="h-2" />
        <SkeletonBone className="h-2" />
        <SkeletonBone className="h-2" />
        <SkeletonBone className="h-2" />
      </div>
    </div>
  );
}

export function HeatmapSkeleton({ className }) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <SkeletonBone key={index} className="mx-auto h-2 w-8" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, index) => (
          <SkeletonBone key={index} className="h-9 rounded-lg" />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <SkeletonBone className="h-2 w-10" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBone key={index} className="h-3 w-3 rounded" />
          ))}
        </div>
        <SkeletonBone className="h-2 w-10" />
      </div>
    </div>
  );
}

export function PageSkeleton({ titleWidth = "w-56" }) {
  return (
    <div className="min-h-screen bg-black p-4 text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-3">
          <SkeletonBone className={cn("h-10", titleWidth)} />
          <SkeletonBone className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <ChartSkeleton className="min-h-[300px]" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <ListSkeleton rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
