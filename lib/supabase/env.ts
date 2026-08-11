/** Resolve Supabase env — supports legacy JWT keys and new sb_publishable / sb_secret keys. */

export function getSupabaseUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return undefined;
  // Allow pasting .../rest/v1/ from the dashboard by mistake
  return raw.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

/** Client / anon key */
export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    undefined
  );
}

/** Server secret / service_role key — never expose to the browser */
export function getSupabaseSecretKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    undefined
  );
}

export function isSupabaseEnvReady(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey() && getSupabaseSecretKey());
}
