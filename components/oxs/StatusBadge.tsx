type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

const toneClass = {
  neutral: "border-slate-500/20 bg-slate-500/15 text-slate-300",
  success: "border-emerald-500/20 bg-emerald-500/15 text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/15 text-amber-300",
  danger: "border-red-500/20 bg-red-500/15 text-red-300",
  info: "border-sky-500/20 bg-sky-500/15 text-sky-300",
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-extrabold ${toneClass[tone]}`}>
      {children}
    </span>
  );
}
