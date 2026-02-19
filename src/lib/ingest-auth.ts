import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "@/lib/api-key";

export function validateSharedApiKey(apiKey: string | null): boolean {
  const expected = process.env.GPT_SHARED_API_KEY;
  if (!expected || !apiKey?.trim()) return false;
  return apiKey.trim() === expected;
}

export async function getUserIdFromEmail(email: string | null): Promise<string | null> {
  if (!email?.trim()) return null;
  const supabase = createAdminClient();
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const user = data.users.find(
    (u) => u.email?.toLowerCase() === email.trim().toLowerCase()
  );
  return user?.id ?? null;
}

export async function getUserIdFromApiKey(apiKey: string | null): Promise<string | null> {
  if (!apiKey?.trim()) return null;
  const supabase = createAdminClient();
  const keyHash = hashApiKey(apiKey);
  const { data, error } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key_hash", keyHash)
    .single();
  if (error || !data) return null;
  return data.user_id;
}
