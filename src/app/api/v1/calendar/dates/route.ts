import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Invalid month (use YYYY-MM)" }, { status: 400 });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, monthNum - 1, 1)).toISOString();
  const monthEnd = new Date(Date.UTC(year, monthNum, 1)).toISOString();

  const dates = new Set<string>();

  const { data: foodLogs } = await supabase
    .from("food_logs")
    .select("eaten_at")
    .eq("user_id", user.id)
    .gte("eaten_at", monthStart)
    .lt("eaten_at", monthEnd);

  for (const row of foodLogs ?? []) {
    if (row.eaten_at) dates.add(row.eaten_at.slice(0, 10));
  }

  const { data: bodyMetrics } = await supabase
    .from("body_metrics")
    .select("measured_at")
    .eq("user_id", user.id)
    .gte("measured_at", monthStart)
    .lt("measured_at", monthEnd);

  for (const row of bodyMetrics ?? []) {
    if (row.measured_at) dates.add(row.measured_at.slice(0, 10));
  }

  const { data: workouts } = await supabase
    .from("workouts")
    .select("started_at")
    .eq("user_id", user.id)
    .gte("started_at", monthStart)
    .lt("started_at", monthEnd);

  for (const row of workouts ?? []) {
    if (row.started_at) dates.add(row.started_at.slice(0, 10));
  }

  return NextResponse.json({ dates: Array.from(dates).sort() });
}
