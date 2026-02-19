import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserIdFromApiKey } from "@/lib/ingest-auth";
import { ingestBodySchema } from "@/lib/validators/body";

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const userId = await getUserIdFromApiKey(apiKey);
  if (!userId) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
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

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("body_metrics")
      .insert({
        user_id: userId,
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
    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
}
