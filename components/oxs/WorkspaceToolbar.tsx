import type { ReactNode } from "react";

type WorkspaceToolbarProps = {
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
};

export function WorkspaceToolbar({ title, children, actions }: WorkspaceToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        {title ? <h2 className="text-xl font-black text-white">{title}</h2> : null}
        {children ? <div className="mt-1 text-sm text-slate-400">{children}</div> : null}
      </div>
      {actions ? <div className="flex flex-col gap-2 md:flex-row md:items-center">{actions}</div> : null}
    </div>
  );
}
