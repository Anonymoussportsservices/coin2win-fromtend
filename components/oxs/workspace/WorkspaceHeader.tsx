import type { ReactNode } from "react";

type WorkspaceHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function WorkspaceHeader({ eyebrow, title, description, actions }: WorkspaceHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        {eyebrow ? (
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{eyebrow}</div>
        ) : null}
        <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
