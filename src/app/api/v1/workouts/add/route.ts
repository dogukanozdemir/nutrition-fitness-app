import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const addWorkoutSchema = z.object({
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  title: z.string().min(1).default("Workout"),
  notes: z.string().optional(),
  entries: z.array(z.object({
    type: z.enum(["strength", "cardio"]),
    exercise: z.string().optional(),
    activity: z.string().optional(),
    sets: z.array(z.object({
      reps: z.number().optional(),
      weightKg: z.number().optional(),
    })).optional(),
    durationMinutes: z.number().optional(),
    distanceKm: z.number().optional(),
    caloriesBurned: z.number().optional(),
  })).default([]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = addWorkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { startedAt, endedAt, title, notes, entries } = parsed.data;

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        started_at: startedAt,
        ended_at: endedAt ?? null,
        title,
        notes: notes ?? null,
      })
      .select("id")
      .single();

    if (workoutError || !workout) {
      return NextResponse.json({ error: workoutError?.message ?? "Failed to create workout" }, { status: 500 });
    }

    if (entries.length > 0) {
      const entryRows = entries.map((e) => ({
        workout_id: workout.id,
        type: e.type,
        exercise: e.type === "strength" ? (e.exercise ?? null) : null,
        sets: e.type === "strength" ? (e.sets ?? []) : null,
        cardio_block: e.type === "cardio" ? {
          activity: e.activity,
          durationMinutes: e.durationMinutes,
          distanceKm: e.distanceKm,
          caloriesBurned: e.caloriesBurned,
        } : null,
      }));
      const { error: entriesError } = await supabase.from("workout_entries").insert(entryRows);
      if (entriesError) {
        return NextResponse.json({ error: entriesError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ id: workout.id, ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to add workout" }, { status: 500 });
  }
}
