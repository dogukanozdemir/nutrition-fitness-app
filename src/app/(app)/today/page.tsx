"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { DateSelector } from "@/components/layout/DateSelector";
import { MacroRings } from "@/components/nutrition/MacroRings";
import { MealList } from "@/components/nutrition/MealList";
import { FoodEntryForm } from "@/components/nutrition/FoodEntryForm";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TodayPage() {
  const { t } = useLanguage();
  const [date, setDate] = useState(new Date());
  const [data, setData] = useState<{
    totals: Record<string, number>;
    logs: Array<{
      id: string;
      eatenAt: string;
      mealType: string;
      rawText: string;
      items: Array<{ id: string; nutrients?: Record<string, number> }>;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    fetch(`/api/v1/food/day?date=${dateStr}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [date]);

  const totals = data?.totals ?? {};
  const logs = data?.logs ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("today.title")}</h1>
          <p className="text-muted-foreground">{t("today.subtitle")}</p>
        </div>
        <FoodEntryForm
          date={date}
          onSuccess={() => {
            const dateStr = format(date, "yyyy-MM-dd");
            fetch(`/api/v1/food/day?date=${dateStr}`)
              .then((r) => r.json())
              .then((d) => setData(d))
              .catch(() => setData(null));
          }}
          labels={{
            addFood: t("today.addFood"),
            logFood: t("today.logFood"),
            whatAte: t("today.whatAte"),
            mealType: t("today.mealType"),
            optionalMacros: t("today.optionalMacros"),
            calories: t("today.calories"),
            protein: t("today.protein"),
            carbs: t("today.carbs"),
            fat: t("today.fat"),
            save: t("today.save"),
            saving: t("today.saving"),
          }}
        />
      </div>
      <DateSelector date={date} onDateChange={setDate} />
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard className="h-40" />
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-48" />
        </div>
      ) : (
        <>
          <MacroRings totals={totals} />
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold">{t("today.summary")}</h2>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryItem label="Calories" value={totals.calories ?? 0} unit="kcal" />
              <SummaryItem label="Protein" value={totals.protein ?? 0} unit="g" />
              <SummaryItem label="Carbs" value={totals.carbs ?? 0} unit="g" />
              <SummaryItem label="Fat" value={totals.fat ?? 0} unit="g" />
              <SummaryItem label="Fiber" value={totals.fiber ?? 0} unit="g" className="col-span-2 sm:col-span-4" />
            </CardContent>
          </Card>
          <div>
            <h2 className="mb-3 text-lg font-semibold">{t("today.meals")}</h2>
            {logs.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title={t("today.noMeals")}
                description={t("today.noMealsDesc")}
              />
            ) : (
              <MealList logs={logs} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  unit,
  className,
}: {
  label: string;
  value: number;
  unit: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-lg font-semibold">
        {Math.round(value)}
        <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
