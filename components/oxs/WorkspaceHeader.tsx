import type { ReactNode } from "react";

type WorkspaceHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function WorkspaceHeader({ title, subtitle, actions }: WorkspaceHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-black text-white md:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-400 md:text-base">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
