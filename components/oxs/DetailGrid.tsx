import type { ReactNode } from "react";

type DetailGridProps = {
  children: ReactNode;
  columns?: "1" | "2" | "3";
  className?: string;
};

const cols = {
  "1": "md:grid-cols-1",
  "2": "md:grid-cols-2",
  "3": "md:grid-cols-3",
};

export function DetailGrid({
  children,
  columns = "2",
  className = "",
}: DetailGridProps) {
  return (
    <div className={`grid gap-3 ${cols[columns]} ${className}`}>
      {children}
    </div>
  );
}

type DetailItemProps = {
  label: string;
  value?: ReactNode;
};

export function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#0f172a] p-4">
      <div className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">
        {value ?? "-"}
      </div>
    </div>
  );
}
