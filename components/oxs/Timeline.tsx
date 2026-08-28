import type { ReactNode } from "react";

type TimelineProps = {
  children: ReactNode;
  className?: string;
};

export function Timeline({ children, className = "" }: TimelineProps) {
  return (
    <div className={`grid gap-3 ${className}`}>
      {children}
    </div>
  );
}

type TimelineItemProps = {
  title: ReactNode;
  timestamp?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

const toneClass = {
  neutral: "bg-slate-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-sky-400",
};

export function TimelineItem({
  title,
  timestamp,
  meta,
  children,
  tone = "neutral",
}: TimelineItemProps) {
  return (
    <div className="relative rounded-2xl border border-white/5 bg-[#13202a] p-4 pl-10">
      <span className={`absolute left-4 top-5 h-3 w-3 rounded-full ${toneClass[tone]}`} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="font-black text-white">{title}</div>
        {timestamp ? <div className="text-xs text-slate-400">{timestamp}</div> : null}
      </div>
      {meta ? <div className="mt-1 text-xs text-slate-400">{meta}</div> : null}
      {children ? <div className="mt-3 text-sm text-slate-300">{children}</div> : null}
    </div>
  );
}
