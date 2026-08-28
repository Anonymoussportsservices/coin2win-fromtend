import type { ReactNode } from "react";

type EntityCardProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function EntityCard({
  title,
  eyebrow,
  children,
  actions,
  className = "",
}: EntityCardProps) {
  return (
    <section className={`rounded-2xl border border-white/5 bg-[#13202a] p-4 ${className}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <div className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              {eyebrow}
            </div>
          ) : null}
          <h3 className="text-lg font-black text-white">{title}</h3>
        </div>

        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>

      {children}
    </section>
  );
}

type EntityFieldGridProps = {
  children: ReactNode;
  className?: string;
};

export function EntityFieldGrid({ children, className = "" }: EntityFieldGridProps) {
  return (
    <div className={`grid gap-2 text-sm text-slate-300 md:grid-cols-2 ${className}`}>
      {children}
    </div>
  );
}

type EntityFieldProps = {
  label: string;
  value?: ReactNode;
};

export function EntityField({ label, value }: EntityFieldProps) {
  return (
    <div>
      <span className="text-slate-500">{label}:</span>{" "}
      <span className="font-semibold text-white">{value || "-"}</span>
    </div>
  );
}
