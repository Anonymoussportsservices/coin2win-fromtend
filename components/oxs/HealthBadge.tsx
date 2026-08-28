type HealthBadgeProps = {
  status?: "healthy" | "watch" | "critical";
  label?: string;
};

const healthConfig = {
  healthy: {
    label: "Healthy",
    className: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  },
  watch: {
    label: "Watch",
    className: "border-amber-400/20 bg-amber-500/10 text-amber-300",
  },
  critical: {
    label: "Critical",
    className: "border-rose-400/20 bg-rose-500/10 text-rose-300",
  },
};

export function HealthBadge({ status = "healthy", label }: HealthBadgeProps) {
  const cfg = healthConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${cfg.className}`}>
      <span>●</span>
      <span>{label || cfg.label}</span>
    </span>
  );
}
