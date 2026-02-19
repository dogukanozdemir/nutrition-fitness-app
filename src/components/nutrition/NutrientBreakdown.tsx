"use client";

import { Pill, Sparkles, Shield, Zap } from "lucide-react";

interface NutrientBreakdownProps {
  nutrients: Record<string, number>;
  ranges?: Record<string, { low?: number; high?: number }> | null;
  confidenceScore?: number | null;
  variant?: "default" | "detail";
}

const SECTIONS: Record<
  string,
  { keys: string[]; icon?: React.ComponentType<{ className?: string }>; color?: string }
> = {
  Macros: {
    keys: ["calories", "protein", "carbs", "fat", "fiber"],
    icon: Zap,
    color: "var(--chart-4)",
  },
  Vitamins: {
    keys: [
      "vitaminA",
      "vitaminC",
      "vitaminD",
      "vitaminE",
      "vitaminK",
      "thiamin",
      "riboflavin",
      "niacin",
      "vitaminB6",
      "folate",
      "vitaminB12",
    ],
    icon: Sparkles,
    color: "var(--chart-2)",
  },
  Minerals: {
    keys: [
      "calcium",
      "iron",
      "magnesium",
      "phosphorus",
      "potassium",
      "zinc",
      "copper",
      "manganese",
      "selenium",
    ],
    icon: Shield,
    color: "var(--chart-3)",
  },
  Electrolytes: {
    keys: ["sodium", "potassium", "chloride"],
    icon: Zap,
    color: "var(--chart-1)",
  },
  Fats: {
    keys: [
      "saturatedFat",
      "monounsaturatedFat",
      "polyunsaturatedFat",
      "omega3",
      "omega6",
      "omega_6",
      "transFat",
    ],
    icon: Pill,
    color: "var(--chart-5)",
  },
};

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatValue(value: number, key: string): string {
  if (key.toLowerCase().includes("percent") || key === "bodyFatPercent") {
    return `${value.toFixed(1)}%`;
  }
  if (value >= 1000) return value.toFixed(0);
  if (value >= 1) return value.toFixed(1);
  return value.toFixed(2);
}

const ALL_SECTION_KEYS = Object.values(SECTIONS).flatMap((s) => s.keys);

export function NutrientBreakdown({
  nutrients,
  ranges,
  confidenceScore,
  variant = "default",
}: NutrientBreakdownProps) {
  const getValue = (key: string): number | null => {
    const v = nutrients[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    const alt = key.replace(/([A-Z])/g, (m) => m.toLowerCase());
    const v2 = nutrients[alt];
    return typeof v2 === "number" && !Number.isNaN(v2) ? v2 : null;
  };

  const isDetail = variant === "detail";

  return (
    <div className="space-y-6">
      {confidenceScore != null && (
        <p className="text-sm text-muted-foreground">
          Confidence: {(confidenceScore * 100).toFixed(0)}%
        </p>
      )}
      {Object.entries(SECTIONS).map(([title, section]) => {
        const keys = section.keys;
        const entries = keys
          .map((k) => {
            const val = getValue(k);
            if (val == null) return null;
            const range = ranges?.[k];
            return { key: k, value: val, range };
          })
          .filter(Boolean) as Array<{
            key: string;
            value: number;
            range?: { low?: number; high?: number };
          }>;

        if (entries.length === 0) return null;

        const Icon = section.icon;

        return (
          <div key={title}>
            <div className="mb-3 flex items-center gap-2">
              {isDetail && Icon && (
                <span
                  className="flex"
                  style={section.color ? { color: section.color } : undefined}
                >
                  <Icon className="h-4 w-4" />
                </span>
              )}
              <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
            </div>
            <div
              className={
                isDetail
                  ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
                  : "grid grid-cols-2 gap-2 sm:grid-cols-3"
              }
            >
              {entries.map(({ key, value, range }) => (
                <div
                  key={key}
                  className={
                    isDetail
                      ? "rounded-xl border border-border/50 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
                      : "rounded-xl border border-border/50 bg-muted/30 px-3 py-2"
                  }
                >
                  <p className="text-xs text-muted-foreground">{formatKey(key)}</p>
                  <p className={isDetail ? "font-mono text-base font-semibold" : "font-mono text-sm font-semibold"}>
                    {formatValue(value, key)}
                    {range && (range.low != null || range.high != null) && (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        ({range.low ?? "?"}–{range.high ?? "?"})
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {Object.entries(nutrients)
        .filter(
          ([k]) =>
            !ALL_SECTION_KEYS.some((s) => s.toLowerCase() === k.toLowerCase())
        )
        .filter(([, v]) => typeof v === "number" && !Number.isNaN(v))
        .length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Other</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(nutrients)
              .filter(
                ([k]) =>
                  !ALL_SECTION_KEYS.some((s) => s.toLowerCase() === k.toLowerCase())
              )
              .filter(([, v]) => typeof v === "number" && !Number.isNaN(v))
              .map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2"
                >
                  <p className="text-xs text-muted-foreground">{formatKey(key)}</p>
                  <p className="font-mono text-sm font-semibold">
                    {formatValue(value, key)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
