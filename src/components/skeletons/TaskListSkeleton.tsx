import { Skeleton } from "@/components/ui/Skeleton";

export default function TaskListSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header: title + buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-24 rounded-lg" />
          <Skeleton className="h-8 w-48 mt-2" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-36 rounded-2xl" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>

      {/* Toolbar: filter pills + search + project dropdown */}
      <div className="p-4 rounded-2xl glass border border-[var(--border)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
          <div className="flex items-center gap-2">
            {[80, 64, 88, 56].map((w, i) => (
              <Skeleton key={i} className="h-9 rounded-xl" style={{ width: w }} />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Skeleton className="h-9 w-full sm:w-64 rounded-xl" />
            <Skeleton className="h-9 w-full sm:w-36 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Task rows */}
      <div className="grid grid-cols-1 gap-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
          >
            <Skeleton className="w-5 h-5 rounded-md flex-shrink-0" />
            <Skeleton className="w-8 h-5 rounded flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 rounded-lg" style={{ width: `${60 + Math.random() * 30}%` }} />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </div>
            <Skeleton className="hidden sm:block h-4 w-16 rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
