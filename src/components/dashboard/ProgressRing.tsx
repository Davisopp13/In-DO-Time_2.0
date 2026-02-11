"use client";

import { useEffect, useState } from "react";

interface ProgressRingProps {
  /** Current value */
  value: number;
  /** Maximum value (for calculating percentage) */
  max: number;
  /** Diameter of the ring in px */
  size?: number;
  /** Stroke width in px */
  strokeWidth?: number;
  /** Label shown below the value (tiny, muted, uppercase) */
  label?: string;
  /** Format function for the center value display */
  formatValue?: (value: number) => string;
}

export default function ProgressRing({
  value,
  max,
  size = 100,
  strokeWidth = 8,
  label = "Done",
  formatValue,
}: ProgressRingProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay to trigger the CSS transition animation on mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = max > 0 ? Math.min(value / max, 1) : 0;
  const strokeDashoffset = circumference * (1 - (mounted ? percentage : 0));

  const displayValue = formatValue ? formatValue(value) : String(value);

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--progress-track)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 800ms ease-out",
            filter: "drop-shadow(0 0 6px var(--accent-glow))",
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold tabular-nums leading-none"
          style={{
            color: "var(--accent)",
            fontSize: size * 0.26,
          }}
        >
          {displayValue}
        </span>
        <span
          className="uppercase font-semibold leading-none"
          style={{
            color: "var(--text-muted)",
            fontSize: size * 0.1,
            letterSpacing: "0.08em",
            marginTop: size * 0.04,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
