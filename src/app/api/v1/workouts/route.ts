import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? "1970-01-01";
  const to = searchParams.get("to") ?? "2100-12-31";

  const { data, error } = await supabase
    .from("workouts")
    .select("id, started_at, ended_at, title, notes")
    .eq("user_id", user.id)
    .gte("started_at", `${from}T00:00:00.000Z`)
    .lte("started_at", `${to}T23:59:59.999Z`)
    .order("started_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const workouts = await Promise.all(
    (data ?? []).map(async (w) => {
      const { count } = await supabase
        .from("workout_entries")
        .select("id", { count: "exact", head: true })
        .eq("workout_id", w.id);
      return {
        id: w.id,
        startedAt: w.started_at,
        endedAt: w.ended_at,
        title: w.title,
        notes: w.notes,
        entryCount: count ?? 0,
      };
    })
  );

  return NextResponse.json(workouts);
}
