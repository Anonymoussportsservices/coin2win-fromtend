import type { ReactNode } from "react";

type SurfaceProps = {
  children: ReactNode;
  className?: string;
};

export function Surface({ children, className = "" }: SurfaceProps) {
  return (
    <div className={`rounded-3xl border border-white/5 bg-[#1a2c38] p-5 ${className}`}>
      {children}
    </div>
  );
}
