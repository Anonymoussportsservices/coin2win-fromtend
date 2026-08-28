import type { ReactNode } from "react";

type KpiGridProps = {
  children: ReactNode;
  columns?: 2 | 3 | 4;
};

export function KpiGrid({ children, columns = 3 }: KpiGridProps) {
  const cols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };

  return <div className={`grid gap-3 ${cols[columns]}`}>{children}</div>;
}
