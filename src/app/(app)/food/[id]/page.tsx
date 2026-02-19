"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ArrowLeft, Trash2, Flame, Beef, Wheat, Droplets, Pill, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NutrientBreakdown } from "@/components/nutrition/NutrientBreakdown";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const MACRO_COLORS = {
  calories: "var(--chart-4)",
  protein: "var(--chart-1)",
  carbs: "var(--chart-2)",
  fat: "var(--chart-3)",
  fiber: "var(--chart-5)",
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export default function FoodDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const id = params.id as string;
  const [data, setData] = useState<{
    rawText: string;
    eatenAt?: string;
    mealType?: string;
    name?: string | null;
    brand?: string | null;
    quantity?: number | null;
    unit?: string | null;
    notes?: string | null;
    nutrients: Record<string, number>;
    ranges?: Record<string, { low?: number; high?: number }> | null;
    confidenceScore?: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/food/item/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-muted-foreground">Food entry not found.</p>
      </div>
    );
  }

  async function handleDelete() {
    const res = await fetch(`/api/v1/food/item/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success(t("common.deleted"));
    router.push("/today");
    router.refresh();
  }

  const calories = data.nutrients?.calories ?? 0;
  const protein = data.nutrients?.protein ?? 0;
  const carbs = data.nutrients?.carbs ?? 0;
  const fat = data.nutrients?.fat ?? 0;
  const fiber = data.nutrients?.fiber ?? 0;

  const macros = [
    { key: "protein", value: protein, unit: "g", icon: Beef, color: MACRO_COLORS.protein },
    { key: "carbs", value: carbs, unit: "g", icon: Wheat, color: MACRO_COLORS.carbs },
    { key: "fat", value: fat, unit: "g", icon: Droplets, color: MACRO_COLORS.fat },
    { key: "fiber", value: fiber, unit: "g", icon: Zap, color: MACRO_COLORS.fiber },
  ].filter((m) => m.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-8"
    >
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("common.deleteConfirm")}</AlertDialogTitle>
              <AlertDialogDescription>
                This food entry will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/8 to-transparent p-6 pb-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--primary)/20%,transparent)]" />
        <div className="relative">
          {data.mealType && (
            <span className="mb-3 inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
              {MEAL_LABELS[data.mealType] ?? data.mealType}
            </span>
          )}
          {data.eatenAt && (
            <p className="mb-2 text-sm text-muted-foreground">
              {format(new Date(data.eatenAt), "EEEE, MMMM d 'at' h:mm a")}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {data.name
              ? data.quantity != null
                ? data.unit
                  ? `${data.name} ${data.quantity}${data.unit}`
                  : `${data.name} x${data.quantity}`
                : data.name
              : data.rawText || "Food entry"}
          </h1>
          {data.brand && (
            <p className="mt-1 text-sm text-muted-foreground">{data.brand}</p>
          )}
          {data.notes && (
            <p className="mt-1 text-sm text-muted-foreground">{data.notes}</p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-stretch"
      >
        <div className="flex flex-1 items-center justify-center gap-4 rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center gap-1">
            <Flame className="h-10 w-10 text-[var(--chart-4)]" />
            <span className="text-4xl font-bold tabular-nums tracking-tight">
              {Math.round(calories)}
            </span>
            <span className="text-sm text-muted-foreground">kcal</span>
          </div>
          <div className="h-12 w-px bg-border/50" />
          <div className="flex flex-wrap justify-center gap-4">
            {macros.map((m, i) => (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.05 }}
                className="flex flex-col items-center gap-0.5"
              >
                <m.icon className="h-5 w-5" style={{ color: m.color }} />
                <span className="font-mono text-lg font-semibold">{Math.round(m.value)}</span>
                <span className="text-xs text-muted-foreground">{m.key}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Nutrient breakdown</h2>
        </div>
        <NutrientBreakdown
          nutrients={data.nutrients}
          ranges={data.ranges}
          confidenceScore={data.confidenceScore}
          variant="detail"
        />
      </motion.div>
    </motion.div>
  );
}
