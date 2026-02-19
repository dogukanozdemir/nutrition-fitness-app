"use client";

import { useState, useEffect } from "react";
import { subMonths, format } from "date-fns";
import { motion } from "framer-motion";
import { WeightChart } from "@/components/body/WeightChart";
import { BodyMetricForm } from "@/components/body/BodyMetricForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { Activity, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";

export default function BodyPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<Array<{
    id: string;
    measuredAt: string;
    weightKg: number;
    bodyFatPercent?: number;
    leanMassKg?: number;
    waistCm?: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  function fetchData() {
    setLoading(true);
    const to = format(new Date(), "yyyy-MM-dd");
    const from = format(subMonths(new Date(), 3), "yyyy-MM-dd");
    fetch(`/api/v1/body/history?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = data.map((d) => ({
    date: d.measuredAt,
    weight: d.weightKg,
    bodyFat: d.bodyFatPercent,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("body.title")}</h1>
          <p className="text-muted-foreground">{t("body.subtitle")}</p>
        </div>
        <BodyMetricForm onSuccess={fetchData} labels={{
          addEntry: t("body.addEntry"),
          logMetrics: t("body.logMetrics"),
          date: t("body.date"),
          weight: t("body.weight"),
          bodyFat: t("body.bodyFat"),
          leanMass: t("body.leanMass"),
          waist: t("body.waist"),
        }} />
      </div>
      {loading ? (
        <SkeletonCard className="h-64" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={t("body.noMetrics")}
          description={t("body.noMetricsDesc")}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <WeightChart data={chartData} />
          <div>
            <h2 className="mb-3 text-lg font-semibold">{t("body.recentEntries")}</h2>
            <div className="space-y-2">
              {data.map((entry) => (
                <BodyEntryRow key={entry.id} entry={entry} onDelete={fetchData} t={t} />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function BodyEntryRow({
  entry,
  onDelete,
  t,
}: {
  entry: { id: string; measuredAt: string; weightKg: number; bodyFatPercent?: number };
  onDelete: () => void;
  t: (key: string) => string;
}) {
  async function handleDelete() {
    const res = await fetch(`/api/v1/body/${entry.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success(t("common.deleted"));
    onDelete();
  }

  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="font-medium">{format(new Date(entry.measuredAt), "MMM d, yyyy")}</p>
          <p className="text-sm text-muted-foreground">
            {entry.weightKg} kg
            {entry.bodyFatPercent != null && ` · ${entry.bodyFatPercent}% body fat`}
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("common.deleteConfirm")}</AlertDialogTitle>
              <AlertDialogDescription>This entry will be permanently removed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
