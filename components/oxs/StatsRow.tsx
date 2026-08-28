import type { ReactNode } from "react";

type StatsRowProps = {
  children: ReactNode;
  columns?: "2" | "3" | "4" | "5";
};

const cols = {
  "2": "xl:grid-cols-2",
  "3": "xl:grid-cols-3",
  "4": "xl:grid-cols-4",
  "5": "xl:grid-cols-5",
};

export function StatsRow({ children, columns = "4" }: StatsRowProps) {
  return (
    <div className={`mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 ${cols[columns]}`}>
      {children}
    </div>
  );
}
