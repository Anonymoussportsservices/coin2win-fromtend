import type { ReactNode } from "react";

type SectionProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function Section({ title, children, actions, className = "" }: SectionProps) {
  return (
    <section className={`rounded-2xl border border-white/5 bg-[#13202a] p-4 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-white">{title}</h2>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
