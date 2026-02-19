import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiKey, hashApiKey } from "@/lib/api-key";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data ?? []).map((k) => ({
      id: k.id,
      name: k.name,
      createdAt: k.created_at,
      masked: "••••••••••••" + (k.name?.slice(-2) ?? ""),
    }))
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() || "Default" : "Default";

    const plainKey = generateApiKey();
    const keyHash = hashApiKey(plainKey);

    const admin = createAdminClient();
    const { data: key, error } = await admin
      .from("api_keys")
      .insert({
        user_id: user.id,
        key_hash: keyHash,
        name,
      })
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: key.id,
      name,
      createdAt: key.created_at,
      key: plainKey,
    });
  } catch {
    return NextResponse.json({ error: "Failed to create key" }, { status: 500 });
  }
}
