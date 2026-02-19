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
    .from("body_metrics")
    .select("id, measured_at, weight_kg, body_fat_percent, lean_mass_kg, waist_cm")
    .eq("user_id", user.id)
    .gte("measured_at", `${from}T00:00:00.000Z`)
    .lte("measured_at", `${to}T23:59:59.999Z`)
    .order("measured_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((r) => ({
      id: r.id,
      measuredAt: r.measured_at,
      weightKg: r.weight_kg,
      bodyFatPercent: r.body_fat_percent,
      leanMassKg: r.lean_mass_kg,
      waistCm: r.waist_cm,
    }))
  );
}
