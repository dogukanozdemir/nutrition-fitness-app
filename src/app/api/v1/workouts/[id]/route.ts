import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/lib/request-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("id, started_at, ended_at, title, notes")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (workoutError || !workout) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: entries } = await supabase
    .from("workout_entries")
    .select("id, type, exercise, sets, cardio_block")
    .eq("workout_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    id: workout.id,
    startedAt: workout.started_at,
    endedAt: workout.ended_at,
    title: workout.title,
    notes: workout.notes,
    entries: (entries ?? []).map((e) => ({
      id: e.id,
      type: e.type,
      exercise: e.exercise,
      sets: e.sets,
      cardioBlock: e.cardio_block,
    })),
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
