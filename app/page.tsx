import { EntranceJourney } from "@/components/home/EntranceJourney";
import { listPublishedShows, getShowStats, isSupabaseConfigured } from "@/lib/db";
import { MOCK_SHOWS } from "@/lib/mock/shows";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const onVercel = Boolean(process.env.VERCEL);
  let shows = MOCK_SHOWS;

  if (onVercel && !isSupabaseConfigured()) {
    console.error(
      "[theater] Missing Supabase env on Vercel. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY",
    );
  }

  try {
    const fromDb = await listPublishedShows();
    if (fromDb.length > 0) shows = fromDb;
  } catch (err) {
    console.error("[theater] Failed to load shows", err);
    shows = onVercel ? [] : MOCK_SHOWS;
  }

  const posters = await Promise.all(
    shows.map(async (show) => {
      try {
        const stats = await getShowStats(show.id);
        return {
          show,
          freeSeats: Math.max(0, stats.total - stats.reserved),
        };
      } catch {
        return {
          show,
          freeSeats: show.row_count * show.seats_per_row,
        };
      }
    }),
  );

  return (
    <main>
      <EntranceJourney posters={posters} />
    </main>
  );
}
