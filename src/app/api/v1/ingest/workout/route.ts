import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateSharedApiKey, getUserIdFromEmail } from "@/lib/ingest-auth";
import { ingestWorkoutSchema } from "@/lib/validators/workout";

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (!validateSharedApiKey(apiKey)) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ingestWorkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { userEmail, startedAt, endedAt, title, notes, entries } = parsed.data;

    const userId = await getUserIdFromEmail(userEmail);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert({
        user_id: userId,
        started_at: startedAt,
        ended_at: endedAt ?? null,
        title: title ?? "Workout",
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
        exercise: e.type === "strength" ? (e as { exercise?: string }).exercise ?? null : null,
        sets: e.type === "strength" ? (e as { sets?: unknown[] }).sets ?? null : null,
        cardio_block: e.type === "cardio" ? e : null,
      }));
      const { error: entriesError } = await supabase.from("workout_entries").insert(entryRows);
      if (entriesError) {
        return NextResponse.json({ error: entriesError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ id: workout.id, ok: true });
  } catch {
    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
}
