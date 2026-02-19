import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserIdFromApiKey } from "@/lib/ingest-auth";
import { ingestFoodSchema } from "@/lib/validators/food";

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const userId = await getUserIdFromApiKey(apiKey);
  if (!userId) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ingestFoodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { eatenAt, mealType, rawText, totals, ranges, confidenceScore, items } = parsed.data;

    const supabase = createAdminClient();
    const { data: log, error: logError } = await supabase
      .from("food_logs")
      .insert({
        user_id: userId,
        eaten_at: eatenAt,
        meal_type: mealType,
        raw_text: rawText ?? null,
        totals: totals ?? {},
        ranges: ranges ?? null,
        confidence_score: confidenceScore ?? null,
      })
      .select("id")
      .single();

    if (logError || !log) {
      return NextResponse.json({ error: logError?.message ?? "Failed to create log" }, { status: 500 });
    }

    const itemRows =
      items.length > 0
        ? items.map((item) => ({
            food_log_id: log.id,
            name: item.name ?? null,
            brand: item.brand ?? null,
            quantity: item.quantity ?? null,
            unit: item.unit ?? null,
            notes: item.notes ?? null,
            nutrients: item.nutrients ?? {},
            ranges: item.ranges ?? null,
            confidence_score: item.confidenceScore ?? null,
          }))
        : [
            {
              food_log_id: log.id,
              name: null,
              brand: null,
              quantity: null,
              unit: null,
              notes: null,
              nutrients: totals ?? {},
              ranges: ranges ?? null,
              confidence_score: confidenceScore ?? null,
            },
          ];
    const { error: itemsError } = await supabase.from("food_items").insert(itemRows);
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ id: log.id, ok: true });
  } catch {
    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
}
