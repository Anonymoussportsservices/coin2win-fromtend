import type { ReactNode } from "react";

type DataTableProps = {
  children: ReactNode;
};

export function DataTable({ children }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#13202a]">
      <table className="min-w-full text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function DataTableHead({ children }: DataTableProps) {
  return (
    <thead className="border-b border-white/5 bg-white/[0.03] text-xs font-black uppercase tracking-[0.14em] text-slate-400">
      {children}
    </thead>
  );
}

export function DataTableBody({ children }: DataTableProps) {
  return <tbody className="divide-y divide-white/5">{children}</tbody>;
}

export function DataTableRow({ children }: DataTableProps) {
  return <tr className="align-top transition hover:bg-white/[0.03]">{children}</tr>;
}

export function DataTableCell({ children }: DataTableProps) {
  return <td className="px-4 py-4 text-slate-300">{children}</td>;
}

export function DataTableHeaderCell({ children }: DataTableProps) {
  return <th className="px-4 py-3">{children}</th>;
}
