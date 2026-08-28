import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger";
};

const toneClass = {
  neutral: "border-white/10 bg-white/10 text-white hover:bg-white/15",
  primary: "border-sky-400/20 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25",
  success: "border-emerald-400/20 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25",
  warning: "border-amber-400/20 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25",
  danger: "border-red-400/20 bg-red-500/15 text-red-200 hover:bg-red-500/25",
};

export function ActionButton({
  children,
  tone = "neutral",
  className = "",
  ...props
}: ActionButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-2xl border px-4 py-3 text-sm font-black transition disabled:opacity-50 ${toneClass[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
