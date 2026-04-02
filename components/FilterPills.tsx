"use client";

import type { CSSProperties } from "react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  options: readonly Option[];
  value: string;
  onChange: (value: string) => void;
  align?: "left" | "right";
};

export default function FilterPills({
  options,
  value,
  onChange,
  align = "left",
}: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: align === "right" ? "flex-end" : "flex-start",
      }}
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              ...pillStyle,
              background: active ? "#00e701" : "rgba(255,255,255,0.06)",
              color: active ? "#071824" : "#dbe7ee",
              borderColor: active ? "#00e701" : "rgba(255,255,255,0.14)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const pillStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  fontWeight: 700,
  fontSize: 13,
  lineHeight: 1,
  cursor: "pointer",
  transition: "all 0.15s ease",
};
