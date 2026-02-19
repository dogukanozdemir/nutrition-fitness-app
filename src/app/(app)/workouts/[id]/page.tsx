"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

interface WorkoutEntry {
  id: string;
  type: "strength" | "cardio";
  exercise?: string | null;
  sets?: unknown[];
  cardioBlock?: {
    activity?: string;
    durationMinutes?: number;
    distanceKm?: number;
    caloriesBurned?: number;
  };
}

export default function WorkoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const id = params.id as string;
  const [data, setData] = useState<{
    title: string;
    startedAt: string;
    endedAt?: string | null;
    notes?: string | null;
    entries: WorkoutEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/workouts/${id}`)
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
        <Skeleton className="h-12 w-3/4 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-muted-foreground">Workout not found.</p>
      </div>
    );
  }

  const duration = data.endedAt
    ? Math.round((new Date(data.endedAt).getTime() - new Date(data.startedAt).getTime()) / 60000)
    : null;

  async function handleDelete() {
    const res = await fetch(`/api/v1/workouts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success(t("common.deleted"));
    router.push("/workouts");
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:text-destructive">
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>{t("common.deleteConfirm")}</AlertDialogTitle>
              <AlertDialogDescription>This workout will be permanently removed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <h1 className="text-xl font-bold">{data.title}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(data.startedAt), "EEEE, MMM d, yyyy")}
            {duration != null && ` · ${duration} min`}
          </p>
          {data.notes && (
            <p className="text-sm text-muted-foreground">{data.notes}</p>
          )}
        </CardHeader>
      </Card>
      <div className="space-y-2">
        {data.entries.map((entry, i) => (
          <Card key={entry.id} className="rounded-2xl border-border/50">
            <CardContent className="p-4">
              {entry.type === "strength" ? (
                <div>
                  <p className="font-medium">{entry.exercise || "Strength"}</p>
                  {Array.isArray(entry.sets) && entry.sets.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {(entry.sets as Array<{ reps?: number; weightKg?: number }>).map((s, j) => (
                        <li key={j}>
                          {s.reps != null && `${s.reps} reps`}
                          {s.weightKg != null && ` @ ${s.weightKg} kg`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">—</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-medium">{entry.cardioBlock?.activity ?? "Cardio"}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {entry.cardioBlock?.durationMinutes != null && (
                      <span>{entry.cardioBlock.durationMinutes} min</span>
                    )}
                    {entry.cardioBlock?.distanceKm != null && (
                      <span>{entry.cardioBlock.distanceKm} km</span>
                    )}
                    {entry.cardioBlock?.caloriesBurned != null && (
                      <span>{entry.cardioBlock.caloriesBurned} kcal</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
