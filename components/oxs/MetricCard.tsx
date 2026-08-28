type MetricCardProps = {
  label: string;
  value: string | number;
  meta?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

const toneClass = {
  neutral: "text-white",
  success: "text-emerald-300",
  warning: "text-amber-300",
  danger: "text-red-300",
  info: "text-sky-300",
};

export function MetricCard({ label, value, meta, tone = "neutral" }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-black ${toneClass[tone]}`}>{value}</div>
      {meta ? <div className="mt-2 text-xs text-slate-400">{meta}</div> : null}
    </div>
  );
}
