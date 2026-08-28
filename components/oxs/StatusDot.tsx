type StatusDotProps = {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

const dotClass = {
  neutral: "bg-slate-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-rose-400",
  info: "bg-sky-400",
};

export function StatusDot({ tone = "neutral" }: StatusDotProps) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotClass[tone]}`} />;
}
