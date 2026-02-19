"use client";

import { motion } from "framer-motion";

interface MacroRingsProps {
  totals: Record<string, number>;
  targets?: { protein?: number; carbs?: number; fat?: number };
}

const COLORS = {
  protein: "var(--chart-1)",
  carbs: "var(--chart-2)",
  fat: "var(--chart-3)",
};

export function MacroRings({ totals, targets = {} }: MacroRingsProps) {
  const protein = totals.protein ?? 0;
  const carbs = totals.carbs ?? 0;
  const fat = totals.fat ?? 0;
  const targetP = targets.protein ?? 150;
  const targetC = targets.carbs ?? 250;
  const targetF = targets.fat ?? 65;

  const pPercent = Math.min(100, (protein / targetP) * 100);
  const cPercent = Math.min(100, (carbs / targetC) * 100);
  const fPercent = Math.min(100, (fat / targetF) * 100);

  const size = 140;
  const stroke = 6;
  const gap = 4;
  const center = size / 2;

  const rings = [
    { percent: pPercent, color: COLORS.protein, r: (size - stroke) / 2 - (stroke + gap) * 0 },
    { percent: cPercent, color: COLORS.carbs, r: (size - stroke) / 2 - (stroke + gap) * 1 },
    { percent: fPercent, color: COLORS.fat, r: (size - stroke) / 2 - (stroke + gap) * 2 },
  ];

  return (
    <div className="flex items-center justify-center gap-6 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
      <svg width={size} height={size} className="-rotate-90">
        {rings.map((ring, i) => {
          const circumference = 2 * Math.PI * ring.r;
          const offset = circumference - (ring.percent / 100) * circumference;
          return (
            <g key={i}>
              <circle
                cx={center}
                cy={center}
                r={ring.r}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className="text-muted/20"
              />
              <motion.circle
                cx={center}
                cy={center}
                r={ring.r}
                fill="none"
                stroke={ring.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              />
            </g>
          );
        })}
      </svg>
      <div className="space-y-2">
        <LegendItem label="Protein" value={protein} unit="g" color={COLORS.protein} />
        <LegendItem label="Carbs" value={carbs} unit="g" color={COLORS.carbs} />
        <LegendItem label="Fat" value={fat} unit="g" color={COLORS.fat} />
      </div>
    </div>
  );
}

function LegendItem({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="font-mono text-sm font-semibold">
        {Math.round(value)}
        {unit}
      </span>
    </div>
  );
}
