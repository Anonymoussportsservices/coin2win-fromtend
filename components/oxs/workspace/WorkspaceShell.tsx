import type { ReactNode } from "react";

type WorkspaceShellProps = {
  children: ReactNode;
  className?: string;
};

export function WorkspaceShell({ children, className = "" }: WorkspaceShellProps) {
  return (
    <section className={`rounded-3xl border border-white/5 bg-[#1a2c38] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)] ${className}`}>
      {children}
    </section>
  );
}
