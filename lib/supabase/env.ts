/** Resolve Supabase env — supports legacy JWT keys and new sb_publishable / sb_secret keys. */

function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

/** HTTP headers must be ByteString (chars ≤ 255). Ellipsis … (8230) often sneaks in from truncated UI copy. */
export function assertHeaderSafe(name: string, value: string): void {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code > 255) {
      const hint =
        code === 8230
          ? "В ключе символ «…» (многоточие). Скопируйте ПОЛНЫЙ ключ из Supabase → API Keys, не обрезанный."
          : `В ${name} недопустимый символ code=${code} at index ${i}.`;
      throw new Error(hint);
    }
  }
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

export function describeKeyProblems(): string[] {
  const problems: string[] = [];
  const checks: Array<[string, string | undefined]> = [
    ["NEXT_PUBLIC_SUPABASE_URL", getSupabaseUrl()],
    ["publishable/anon key", getSupabasePublishableKey()],
    ["secret/service_role key", getSupabaseSecretKey()],
  ];
  for (const [label, value] of checks) {
    if (!value) {
      problems.push(`${label}: отсутствует`);
      continue;
    }
    for (let i = 0; i < value.length; i++) {
      if (value.charCodeAt(i) > 255) {
        problems.push(
          value.charCodeAt(i) === 8230
            ? `${label}: содержит «…» — вставьте полный ключ без многоточия`
            : `${label}: не-ASCII символ at ${i}`,
        );
        break;
      }
    }
    if (value.includes("…") || value.includes("...")) {
      // "..." might be intentional in rare cases; flag unicode ellipsis above.
      if (value.includes("…")) {
        problems.push(`${label}: похоже на обрезанный ключ`);
      }
    }
  }
  return problems;
}
