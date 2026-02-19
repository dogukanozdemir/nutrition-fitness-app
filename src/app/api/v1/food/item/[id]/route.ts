import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserIdFromRequest } from "@/lib/request-auth";

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

  const { data: item, error } = await supabase
    .from("food_items")
    .select("id, food_log_id, name, brand, quantity, unit, notes, nutrients, ranges, confidence_score")
    .eq("id", id)
    .single();

  if (error || !item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: log } = await supabase
    .from("food_logs")
    .select("user_id, raw_text, eaten_at, meal_type")
    .eq("id", item.food_log_id)
    .single();

  if (!log || log.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: item.id,
    rawText: log.raw_text ?? "",
    eatenAt: log.eaten_at,
    mealType: log.meal_type,
    name: item.name ?? null,
    brand: item.brand ?? null,
    quantity: item.quantity ?? null,
    unit: item.unit ?? null,
    notes: item.notes ?? null,
    nutrients: item.nutrients ?? {},
    ranges: item.ranges ?? null,
    confidenceScore: item.confidence_score ?? null,
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
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const client = createAdminClient();

  const { data: item } = await client
    .from("food_items")
    .select("id, food_log_id")
    .eq("id", id)
    .single();

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: log } = await client
    .from("food_logs")
    .select("user_id")
    .eq("id", item.food_log_id)
    .single();

  if (!log || log.user_id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: siblingItems } = await client
    .from("food_items")
    .select("id")
    .eq("food_log_id", item.food_log_id)
    .neq("id", id);

  await client.from("food_items").delete().eq("id", id);

  if (!siblingItems?.length) {
    await client.from("food_logs").delete().eq("id", item.food_log_id);
  }

  return NextResponse.json({ ok: true });
}
