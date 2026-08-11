import {
  getSupabasePublishableKey,
  getSupabaseSecretKey,
  getSupabaseUrl,
  isSupabaseEnvReady,
} from "@/lib/supabase/env";

/** Fetch with a hard timeout so Vercel pages don't hang for 10–15s. */
export function supabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const timeoutMs = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS || 6000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const parent = init?.signal;
  if (parent) {
    if (parent.aborted) controller.abort();
    else parent.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

export function assertSupabaseEnv(): void {
  if (!isSupabaseEnvReady()) {
    throw new Error(
      `Supabase env incomplete (url=${Boolean(getSupabaseUrl())}, publishable=${Boolean(getSupabasePublishableKey())}, secret=${Boolean(getSupabaseSecretKey())})`,
    );
  }
}
