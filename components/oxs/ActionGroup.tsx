import type { ReactNode } from "react";

type ActionGroupProps = {
  children: ReactNode;
  className?: string;
};

export function ActionGroup({ children, className = "" }: ActionGroupProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {children}
    </div>
  );
}
