"use client";
export default function GameInfoCard({ title, children }: { title?: string; children?: any }) {
  return <div>{title ? <div>{title}</div> : null}{children}</div>;
}
