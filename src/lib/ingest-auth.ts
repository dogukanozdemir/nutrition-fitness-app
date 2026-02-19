import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "@/lib/api-key";

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
