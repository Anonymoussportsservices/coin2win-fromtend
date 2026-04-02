"use client";

import { useMemo } from "react";

type CrashGraphProps = {
  multiplier: number;
  status: string;
  isMobileLike: boolean;
  dotPulse: number;
};

type Point = { x: number; y: number };

function cubicPoint(t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  return {
    x:
      mt2 * mt * p0.x +
      3 * mt2 * t * p1.x +
      3 * mt * t2 * p2.x +
      t2 * t * p3.x,
    y:
      mt2 * mt * p0.y +
      3 * mt2 * t * p1.y +
      3 * mt * t2 * p2.y +
      t2 * t * p3.y,
  };
}

function cubicDerivative(t: number, p0: Point, p1: Point, p2: Point, p3: Point) {
  const mt = 1 - t;

  return {
    dx:
      3 * mt * mt * (p1.x - p0.x) +
      6 * mt * t * (p2.x - p1.x) +
      3 * t * t * (p3.x - p2.x),
    dy:
      3 * mt * mt * (p1.y - p0.y) +
      6 * mt * t * (p2.y - p1.y) +
      3 * t * t * (p3.y - p2.y),
  };
}

function buildCurve(multiplier: number, isMobileLike: boolean) {
  const width = 900;
  const padding = isMobileLike ? 18 : 20;
  const originX = 20;
  const originY = isMobileLike ? 258 : 220;
  const riseMaxY = isMobileLike ? 82 : 70;

  const current = Math.max(1, Number(multiplier || 1));
  const effective = Math.max(0, current - 1);
  const normalized = Math.min(effective / 9, 1);

  const endX = originX + normalized * (width - originX - padding);
  const endY = originY - normalized * (originY - riseMaxY);

  const p0 = { x: originX, y: originY };
  const p1 = {
    x: originX + (endX - originX) * 0.26,
    y: originY - normalized * (originY - riseMaxY) * 0.05,
  };
  const p2 = {
    x: originX + (endX - originX) * 0.74,
    y: originY - normalized * (originY - riseMaxY) * 0.66,
  };
  const p3 = { x: endX, y: endY };

  // Dot always sits on the true curve tip.
  const tip = cubicPoint(1, p0, p1, p2, p3);
  const deriv = cubicDerivative(1, p0, p1, p2, p3);
  const len = Math.max(1, Math.hypot(deriv.dx, deriv.dy));
  const ux = deriv.dx / len;
  const uy = deriv.dy / len;

  // Tiny forward bias only for visual polish.
  const lead = isMobileLike ? 1.35 : 1.1;
  const dotX = tip.x + ux * lead;
  const dotY = tip.y + uy * lead;

  // Critical: render the visible curve only up to tCut, not all the way to the tip.
  // Stronger cut in the annoying 4x–10x range.
  let tCut = 0.988;
  if (current >= 10) tCut = 0.972;
  else if (current >= 7) tCut = 0.962;
  else if (current >= 5) tCut = 0.955;
  else if (current >= 4) tCut = 0.95;
  else if (current >= 2) tCut = 0.975;

  const samples = 44;
  const visiblePoints: Point[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = (i / samples) * tCut;
    visiblePoints.push(cubicPoint(t, p0, p1, p2, p3));
  }

  const visiblePath = visiblePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return {
    visiblePath,
    dotX,
    dotY,
    trailX: dotX - (isMobileLike ? 6 : 5),
    trailY: dotY + (isMobileLike ? 1.2 : 0.9),
  };
}

export default function CrashGraph({
  multiplier,
  status,
  isMobileLike,
  dotPulse,
}: CrashGraphProps) {
  const meta = useMemo(
    () => buildCurve(multiplier, isMobileLike),
    [multiplier, isMobileLike]
  );

  const crashed = String(status || "").toLowerCase() === "crashed";

  return (
    <svg
      viewBox={isMobileLike ? "0 0 900 280" : "0 0 900 240"}
      preserveAspectRatio="none"
      style={{
        width: "100%",
        maxWidth: "100%",
        display: "block",
        height: isMobileLike ? 170 : 160,
      }}
    >
      <defs>
        <linearGradient id="crashLineV2" x1="0%" x2="100%" y1="100%" y2="0%">
          <stop offset="0%" stopColor="#00e701" />
          <stop offset="100%" stopColor="#86efac" />
        </linearGradient>
      </defs>

      <line
        x1="20"
        y1={isMobileLike ? "258" : "220"}
        x2="880"
        y2={isMobileLike ? "258" : "220"}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
      />
      <line
        x1="20"
        y1={isMobileLike ? "258" : "220"}
        x2="20"
        y2="20"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
      />

      <path
        d={meta.visiblePath}
        fill="none"
        stroke={crashed ? "#ff5d5d" : "url(#crashLineV2)"}
        strokeWidth={isMobileLike ? "6" : "5"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <ellipse
        cx={meta.trailX}
        cy={meta.trailY}
        rx={isMobileLike ? 12 : 10}
        ry={isMobileLike ? 7 : 6}
        fill={crashed ? "rgba(255,93,93,0.10)" : "rgba(0,231,1,0.10)"}
        style={{ transition: "all 0.25s ease" }}
      />

      <circle
        cx={meta.dotX}
        cy={meta.dotY}
        r={(isMobileLike ? 22 : 18) * dotPulse}
        fill={crashed ? "rgba(255,93,93,0.10)" : "rgba(0,231,1,0.10)"}
        style={{ transition: "all 0.25s ease" }}
      />

      <circle
        cx={meta.dotX}
        cy={meta.dotY}
        r={(isMobileLike ? 14 : 12) * dotPulse}
        fill={crashed ? "rgba(255,93,93,0.18)" : "rgba(0,231,1,0.18)"}
        style={{ transition: "all 0.25s ease" }}
      />

      <circle
        cx={meta.dotX}
        cy={meta.dotY}
        r={(isMobileLike ? 11 : 10) * dotPulse}
        fill={crashed ? "#ff5d5d" : "#00e701"}
        stroke="#ffffff"
        strokeWidth="2.5"
        style={{
          filter: crashed
            ? "drop-shadow(0 0 14px rgba(255,93,93,0.7))"
            : "drop-shadow(0 0 14px rgba(0,231,1,0.7))",
          transition: "all 0.25s ease",
        }}
      />

      <circle
        cx={meta.dotX}
        cy={meta.dotY}
        r={(isMobileLike ? 6 : 5) * dotPulse}
        fill={crashed ? "#ff5d5d" : "#00e701"}
        stroke="#ffffff"
        strokeWidth="2"
        style={{
          filter: crashed
            ? "drop-shadow(0 0 8px rgba(255,93,93,0.45))"
            : "drop-shadow(0 0 8px rgba(0,231,1,0.45))",
          transition: "all 0.25s ease",
        }}
      />
    </svg>
  );
}
