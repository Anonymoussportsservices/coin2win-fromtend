import type { ReactNode } from "react";

type NoticeProps = {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
};

const toneClass = {
  neutral: "border-white/5 bg-[#13202a] text-slate-300",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  danger: "border-red-500/20 bg-red-500/10 text-red-300",
  info: "border-sky-500/20 bg-sky-500/10 text-sky-300",
};

export function Notice({
  children,
  tone = "neutral",
  className = "",
}: NoticeProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass[tone]} ${className}`}>
      {children}
    </div>
  );
}
