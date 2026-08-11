/** Resolve Supabase env — supports legacy JWT keys and new sb_publishable / sb_secret keys. */

function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getSupabaseUrl(): string | undefined {
  const raw = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!raw) return undefined;
  // Allow pasting .../rest/v1/ from the dashboard by mistake
  return raw.replace(/\/rest\/v1\/?$/i, "").replace(/\/$/, "");
}

/** Client / anon key */
export function getSupabasePublishableKey(): string | undefined {
  return clean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Server secret / service_role key — never expose to the browser */
export function getSupabaseSecretKey(): string | undefined {
  return clean(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isSupabaseEnvReady(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey() && getSupabaseSecretKey());
}
