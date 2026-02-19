import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date (use YYYY-MM-DD)" }, { status: 400 });
  }

  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const { data: logs, error: logsError } = await supabase
    .from("food_logs")
    .select("id, eaten_at, meal_type, raw_text, totals")
    .eq("user_id", user.id)
    .gte("eaten_at", dayStart)
    .lte("eaten_at", dayEnd)
    .order("eaten_at", { ascending: true });

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 });
  }

  const totals: Record<string, number> = {};
  const logsWithItems: Array<{
    id: string;
    eatenAt: string;
    mealType: string;
    rawText: string;
    items: Array<{
      id: string;
      name?: string | null;
      brand?: string | null;
      quantity?: number | null;
      unit?: string | null;
      notes?: string | null;
      nutrients?: Record<string, number>;
    }>;
  }> = [];

  for (const log of logs ?? []) {
    const { data: items } = await supabase
      .from("food_items")
      .select("id, name, brand, quantity, unit, notes, nutrients")
      .eq("food_log_id", log.id)
      .order("created_at", { ascending: true });

    const itemList = (items ?? []).map((i) => {
      const raw = (i.nutrients as Record<string, number>) ?? {};
      const nutrients: Record<string, number> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "number" && !Number.isNaN(v)) {
          const key = k.toLowerCase();
          nutrients[key] = (nutrients[key] ?? 0) + v;
          totals[key] = (totals[key] ?? 0) + v;
        }
      }
      return {
        id: i.id,
        name: i.name ?? null,
        brand: i.brand ?? null,
        quantity: i.quantity ?? null,
        unit: i.unit ?? null,
        notes: i.notes ?? null,
        nutrients,
      };
    });

    logsWithItems.push({
      id: log.id,
      eatenAt: log.eaten_at,
      mealType: log.meal_type,
      rawText: log.raw_text ?? "",
      items: itemList,
    });
  }

  return NextResponse.json({ totals, logs: logsWithItems });
}
