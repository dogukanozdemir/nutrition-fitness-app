"use client";

import { motion } from "framer-motion";
import { FoodEntryCard } from "./FoodEntryCard";

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"];

interface MealLog {
  id: string;
  eatenAt: string;
  mealType: string;
  rawText: string;
  items: Array<{ id: string; nutrients?: Record<string, number> }>;
}

interface FlatEntry {
  id: string;
  rawText: string;
  nutrients: Record<string, number>;
  mealType: string;
}

export function MealList({ logs }: { logs: MealLog[] }) {
  const grouped = logs.reduce<Record<string, FlatEntry[]>>((acc, log) => {
    const key = log.mealType || "other";
    if (!acc[key]) acc[key] = [];
    for (const item of log.items) {
      acc[key].push({
        id: item.id,
        rawText: log.items.length === 1 ? log.rawText : log.rawText,
        nutrients: item.nutrients ?? {},
        mealType: log.mealType,
      });
    }
    return acc;
  }, {});

  const ordered = MEAL_ORDER.filter((m) => grouped[m]?.length).concat(
    Object.keys(grouped).filter((m) => !MEAL_ORDER.includes(m))
  );

  return (
    <div className="space-y-6">
      {ordered.map((mealType, i) => (
        <motion.section
          key={mealType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <h3 className="mb-2 text-sm font-medium capitalize text-muted-foreground">
            {mealType}
          </h3>
          <div className="space-y-2">
            {(grouped[mealType] ?? []).map((entry, j) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 + j * 0.03 }}
              >
                <FoodEntryCard entry={entry} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      ))}
    </div>
  );
}
