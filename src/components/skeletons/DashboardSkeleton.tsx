import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Row 0: Greeting */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48 opacity-60" />
      </div>

      {/* Row 1: Stats + Focus Task */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Stats row — progress ring + 4 stat cards */}
        <div className="md:col-span-2">
          <div className="glass p-4 rounded-2xl border border-[var(--border)]">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Skeleton className="w-[100px] h-[100px] rounded-full flex-shrink-0" />
              <div className="grid grid-cols-2 gap-5 flex-1 w-full">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Focus task */}
        <div className="md:col-span-2 lg:col-span-1">
          <Skeleton className="h-[148px] w-full" />
        </div>
      </div>

      {/* Row 2: Active Timers Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-60 flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Row 3: Today's Tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16 opacity-60" />
        </div>
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
            >
              <Skeleton className="w-5 h-5 rounded-md flex-shrink-0" />
              <Skeleton className="w-8 h-5 rounded flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-4 rounded-lg" style={{ width: `${50 + i * 10}%` }} />
                <Skeleton className="h-3 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Journal + Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Journal */}
        <div className="glass p-5 rounded-2xl border border-[var(--border)] space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-5/6 rounded-lg" />
        </div>
        {/* Projects */}
        <div className="glass p-5 rounded-2xl border border-[var(--border)] space-y-3">
          <Skeleton className="h-5 w-32" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-3 h-3 rounded-full flex-shrink-0" />
              <Skeleton className="h-4 flex-1 rounded-lg" />
              <Skeleton className="h-3 w-12 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
