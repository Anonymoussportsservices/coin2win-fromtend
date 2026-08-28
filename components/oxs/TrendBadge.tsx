type TrendBadgeProps = {
  direction?: "up" | "stable" | "down";
  label?: string;
  value?: string | number;
};

const trendConfig = {
  up: {
    symbol: "▲",
    label: "Growing",
    className: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  },
  stable: {
    symbol: "▬",
    label: "Stable",
    className: "border-slate-400/20 bg-white/5 text-slate-300",
  },
  down: {
    symbol: "▼",
    label: "Slowing",
    className: "border-rose-400/20 bg-rose-500/10 text-rose-300",
  },
};

export function TrendBadge({ direction = "stable", label, value }: TrendBadgeProps) {
  const cfg = trendConfig[direction];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${cfg.className}`}>
      <span>{cfg.symbol}</span>
      <span>{label || cfg.label}</span>
      {value !== undefined && value !== null ? <span>{value}</span> : null}
    </span>
  );
}
