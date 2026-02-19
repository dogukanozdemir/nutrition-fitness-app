import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const addFoodSchema = z.object({
  eatenAt: z.string().datetime(),
  mealType: z.string().default("snack"),
  rawText: z.string().min(1),
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = addFoodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { eatenAt, mealType, rawText, calories, protein, carbs, fat, fiber } = parsed.data;

    const totals: Record<string, number> = {};
    if (calories != null) totals.calories = calories;
    if (protein != null) totals.protein = protein;
    if (carbs != null) totals.carbs = carbs;
    if (fat != null) totals.fat = fat;
    if (fiber != null) totals.fiber = fiber;

    const nutrients = { ...totals };

    const { data: log, error: logError } = await supabase
      .from("food_logs")
      .insert({
        user_id: user.id,
        eaten_at: eatenAt,
        meal_type: mealType,
        raw_text: rawText,
        totals,
      })
      .select("id")
      .single();

    if (logError || !log) {
      return NextResponse.json({ error: logError?.message ?? "Failed to create log" }, { status: 500 });
    }

    const { error: itemError } = await supabase.from("food_items").insert({
      food_log_id: log.id,
      nutrients,
    });

    if (itemError) {
      return NextResponse.json({ error: itemError.message }, { status: 500 });
    }

    return NextResponse.json({ id: log.id, ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to add food" }, { status: 500 });
  }
}
