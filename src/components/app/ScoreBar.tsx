import { cn } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  value: number; // 0-100
  variant?: "default" | "risk";
}

export function ScoreBar({ label, value, variant = "default" }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  const isRisk = variant === "risk";
  const colorClass = isRisk
    ? pct > 60 ? "bg-destructive" : pct > 30 ? "bg-warning" : "bg-success"
    : pct > 60 ? "bg-primary" : pct > 30 ? "bg-accent" : "bg-muted-foreground";

  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{label}</span>
        <span className="text-[10px] font-mono font-medium tabular-nums">{pct}</span>
      </div>
      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <div className={cn("h-full transition-all", colorClass)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
