import { createClient } from "@supabase/supabase-js";

export async function getSupabaseUserFromAccessToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !anon) {
    return { error: "Supabase is not configured" as const, user: null };
  }
  const supabase = createClient(url, anon);
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return { error: error?.message ?? "Invalid token", user: null };
  }
  return { error: null as null, user: data.user };
}
