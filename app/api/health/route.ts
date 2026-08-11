import { NextResponse } from "next/server";
import { listPublishedShows, isSupabaseConfigured } from "@/lib/db";
import {
  describeKeyProblems,
  getSupabasePublishableKey,
  getSupabaseSecretKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/** Lightweight probe for Vercel env / DB connectivity (no secrets returned). */
export async function GET() {
  const url = getSupabaseUrl();
  const configured = isSupabaseConfigured();
  const keyProblems = describeKeyProblems();
  let shows = 0;
  let error: string | null = null;
  const started = Date.now();

  if (keyProblems.length > 0) {
    error = keyProblems.join("; ");
  } else if (configured) {
    try {
      const list = await listPublishedShows();
      shows = list.length;
    } catch (e) {
      error = e instanceof Error ? e.message : "unknown error";
    }
  }

  return NextResponse.json({
    ok: configured && !error && shows > 0,
    configured,
    hasUrl: Boolean(url),
    hasPublishable: Boolean(getSupabasePublishableKey()),
    hasSecret: Boolean(getSupabaseSecretKey()),
    publishableLength: getSupabasePublishableKey()?.length ?? 0,
    secretLength: getSupabaseSecretKey()?.length ?? 0,
    urlHost: url ? new URL(url).host : null,
    publishedShows: shows,
    error,
    ms: Date.now() - started,
    vercel: Boolean(process.env.VERCEL),
  });
}
