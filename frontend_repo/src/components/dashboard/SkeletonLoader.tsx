import { cn } from "@/lib/utils";

// ─── Primitive shimmer box ────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-muted/60",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        "before:animate-[shimmer_1.6s_ease-in-out_infinite]",
        className
      )}
      style={style}
    />
  );
}

// ─── EligibilityOverview skeleton ────────────────────────────────────────────

export function EligibilityOverviewSkeleton() {
  return (
    <div className="glass-card premium-card p-6 mb-7 animate-fade-in">
      <Skeleton className="h-5 w-44 mb-5" />
      {/* Metric pills row */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        {[80, 64, 64, 80, 60, 60].map((w, i) => (
          <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
        ))}
      </div>
      {/* Content area */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[180px] bg-muted/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-10 rounded-lg" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="ml-auto h-8 w-10 rounded-lg" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[100, 120, 90, 110].map((w, i) => (
              <Skeleton key={i} className="h-6 rounded-full" style={{ width: w }} />
            ))}
          </div>
          <Skeleton className="h-2 w-full rounded-full mt-3" />
        </div>
        {/* Avatar speech bubble */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-20 w-40 rounded-xl" />
          <Skeleton className="w-16 h-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── RecommendedSchemes skeleton ─────────────────────────────────────────────

export function RecommendedSchemesSkeleton() {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between mb-5">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-5 rounded-xl border border-border bg-card premium-card space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-32 mt-2" />
        </div>
      ))}
    </div>
  );
}

// ─── SimulatorGauge skeleton ─────────────────────────────────────────────────

export function SimulatorGaugeSkeleton() {
  return (
    <div className="glass-card premium-card p-6 mb-4 animate-fade-in">
      <Skeleton className="h-4 w-44 mb-4" />
      <div className="flex gap-4 items-start">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-28 mb-1" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
      </div>
      <Skeleton className="h-10 w-full mt-3 rounded-xl" />
    </div>
  );
}

// ─── RequiredDocuments skeleton ──────────────────────────────────────────────

export function RequiredDocumentsSkeleton() {
  return (
    <div className="glass-card premium-card p-6 animate-fade-in">
      <Skeleton className="h-4 w-40 mb-4" />
      <div className="space-y-2.5">
        {[150, 130, 170, 120].map((w, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="h-4" style={{ width: w }} />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full mt-4 rounded-xl" />
    </div>
  );
}

// ─── HeroSection profile chips skeleton ─────────────────────────────────────

export function ProfileChipsSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 animate-fade-in">
      {["Age", "State", "Caste", "Monthly Income", "Annual Income"].map((label) => (
        <div key={label} className="rounded-lg border border-border bg-card px-3 py-2 space-y-1">
          <Skeleton className="h-2 w-10" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── Full-page loading overlay ───────────────────────────────────────────────

export function LoadingOverlay({ message = "Analysing your profile..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      {/* Animated Ashoka Chakra */}
      <div className="relative w-20 h-20 mb-6">
        <svg viewBox="0 0 200 200" className="w-full h-full animate-[spin_3s_linear_infinite]">
          <circle cx="100" cy="100" r="72" fill="none" stroke="hsl(var(--primary))" strokeWidth="5" opacity="0.3" />
          <circle cx="100" cy="100" r="8" fill="hsl(var(--primary))" opacity="0.6" />
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={i}
              x1="100" y1="100" x2="100" y2="32"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              opacity={0.3 + (i % 6) * 0.1}
              transform={`rotate(${i * 15} 100 100)`}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
        </div>
      </div>
      <p className="text-sm font-semibold text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">Powered by GPT-OSS-120B + FAISS RAG</p>
    </div>
  );
}
