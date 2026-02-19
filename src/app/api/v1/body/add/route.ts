import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ingestBodySchema } from "@/lib/validators/body";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ingestBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { measuredAt, weightKg, bodyFatPercent, leanMassKg, waistCm } = parsed.data;

    const { data, error } = await supabase
      .from("body_metrics")
      .insert({
        user_id: user.id,
        measured_at: measuredAt,
        weight_kg: weightKg,
        body_fat_percent: bodyFatPercent ?? null,
        lean_mass_kg: leanMassKg ?? null,
        waist_cm: waistCm ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id: data.id, ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }
}
