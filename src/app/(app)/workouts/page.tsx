"use client";

import { useState, useEffect } from "react";
import { subMonths, format } from "date-fns";
import { motion } from "framer-motion";
import { WorkoutCard } from "@/components/workouts/WorkoutCard";
import { WorkoutForm } from "@/components/workouts/WorkoutForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { SkeletonCard } from "@/components/shared/SkeletonCard";
import { Dumbbell } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WorkoutsPage() {
  const { t } = useLanguage();

  const [workouts, setWorkouts] = useState<Array<{
    id: string;
    startedAt: string;
    endedAt?: string | null;
    title: string;
    notes?: string | null;
    entryCount: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  function fetchWorkouts() {
    const to = format(new Date(), "yyyy-MM-dd");
    const from = format(subMonths(new Date(), 3), "yyyy-MM-dd");
    fetch(`/api/v1/workouts?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then(setWorkouts)
      .catch(() => setWorkouts([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    fetchWorkouts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("workouts.title")}</h1>
          <p className="text-muted-foreground">{t("workouts.subtitle")}</p>
        </div>
        <WorkoutForm
          onSuccess={fetchWorkouts}
          labels={{
            addWorkout: t("workouts.addWorkout"),
            logWorkout: t("workouts.logWorkout"),
            sessionName: t("workouts.sessionName"),
            date: t("workouts.workoutDate"),
            notes: t("workouts.notes"),
            exercises: t("workouts.exercises"),
            addStrength: t("workouts.addStrength"),
            addCardio: t("workouts.addCardio"),
            exerciseName: t("workouts.exerciseName"),
            sets: t("workouts.sets"),
            reps: t("workouts.reps"),
            weight: t("workouts.weight"),
            addSet: t("workouts.addSet"),
            activity: t("workouts.activity"),
            duration: t("workouts.duration"),
            distance: t("workouts.distance"),
            save: t("today.save"),
            saving: t("today.saving"),
          }}
        />
      </div>
      {loading ? (
        <div className="space-y-2">
          <SkeletonCard className="h-20" />
          <SkeletonCard className="h-20" />
          <SkeletonCard className="h-20" />
        </div>
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={t("workouts.noWorkouts")}
          description={t("workouts.noWorkoutsDesc")}
        />
      ) : (
        <div className="space-y-2">
          {workouts.map((w, i) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <WorkoutCard workout={w} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
