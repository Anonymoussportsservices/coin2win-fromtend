import type { ReactNode } from "react";
import { ActionButton } from "./ActionButton";
import { HealthBadge } from "./HealthBadge";
import { TrendBadge } from "./TrendBadge";

type ModuleCardProps = {
  title: string;
  eyebrow?: string;
  status?: "up" | "stable" | "down";
  headline: string;
  recommendation: string;
  urgency?: "healthy" | "watch" | "critical";
  actionLabel: string;
  onAction?: () => void;
  href?: string;
  footer?: ReactNode;
};

export function ModuleCard({
  title,
  eyebrow,
  status = "stable",
  headline,
  recommendation,
  urgency = "healthy",
  actionLabel,
  onAction,
  href,
  footer,
}: ModuleCardProps) {
  const action = href ? (
    <a href={href} className="text-sm font-black text-sky-300 hover:text-sky-200">
      {actionLabel} →
    </a>
  ) : (
    <ActionButton type="button" tone="primary" onClick={onAction} className="px-3 py-2 text-xs">
      {actionLabel} →
    </ActionButton>
  );

  return (
    <section className="rounded-2xl border border-white/5 bg-[#13202a] p-4 transition hover:border-white/10 hover:bg-[#172633]">
      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow ? (
            <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{eyebrow}</div>
          ) : null}
          <h3 className="mt-1 text-lg font-black text-white">{title}</h3>
        </div>
        <HealthBadge status={urgency} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <TrendBadge direction={status} />
      </div>

      <div className="mt-4 text-xl font-black text-white">{headline}</div>
      <div className="mt-2 text-sm text-slate-400">{recommendation}</div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="min-w-0">{footer}</div>
        {action}
      </div>
    </section>
  );
}
