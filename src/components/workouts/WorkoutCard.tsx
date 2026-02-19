"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WorkoutCardProps {
  workout: {
    id: string;
    startedAt: string;
    endedAt?: string | null;
    title: string;
    entryCount: number;
  };
}

function formatDuration(start: string, end?: string | null): string {
  if (!end) return "—";
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const mins = Math.round((e - s) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const duration = formatDuration(workout.startedAt, workout.endedAt);

  return (
    <Link href={`/workouts/${workout.id}`}>
      <motion.div whileTap={{ scale: 0.98 }} className="block">
        <Card className="rounded-2xl border-border/50 shadow-sm transition-colors hover:bg-accent/50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{workout.title}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(workout.startedAt), "MMM d, yyyy")} · {workout.entryCount} exercises
                {duration !== "—" && ` · ${duration}`}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
