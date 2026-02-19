import { createClient } from "@/lib/supabase/server";
import { getUserIdFromApiKey } from "@/lib/ingest-auth";

export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    return getUserIdFromApiKey(apiKey);
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
