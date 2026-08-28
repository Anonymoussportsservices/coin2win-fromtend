import type { ReactNode } from "react";

type ContextPanelProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  empty?: boolean;
  emptyTitle?: string;
};

export function ContextPanel({
  eyebrow = "Context",
  title,
  subtitle,
  children,
  actions,
  empty = false,
  emptyTitle = "Select an item to view context.",
}: ContextPanelProps) {
  return (
    <aside className="rounded-2xl border border-white/5 bg-[#13202a] p-4">
      <div className="mb-4">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{eyebrow}</div>
        <h3 className="mt-1 text-lg font-black text-white">{empty ? emptyTitle : title}</h3>
        {subtitle && !empty ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
      </div>

      {empty ? (
        <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-4 text-sm text-slate-400">
          Choose a row from the workspace.
        </div>
      ) : (
        <>
          <div className="grid gap-3">{children}</div>
          {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
        </>
      )}
    </aside>
  );
}
