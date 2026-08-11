import { EntranceJourney } from "@/components/home/EntranceJourney";
import { listPublishedShows, getShowStats, isSupabaseConfigured } from "@/lib/db";
import { MOCK_SHOWS } from "@/lib/mock/shows";
import type { Show } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export default async function HomePage() {
  const onVercel = Boolean(process.env.VERCEL);
  let shows: Show[] = [];
  let loadError: string | null = null;

  if (!isSupabaseConfigured()) {
    if (onVercel) {
      loadError =
        "Не заданы переменные Supabase на Vercel (URL, publishable, secret).";
      console.error("[theater]", loadError);
    } else {
      shows = MOCK_SHOWS;
    }
  } else {
    try {
      shows = await listPublishedShows();
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Ошибка загрузки";
      console.error("[theater] Failed to load shows", err);
      if (!onVercel) shows = MOCK_SHOWS;
    }
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
          freeSeats: Math.max(0, show.capacity || show.row_count * show.seats_per_row),
        };
      }
    }),
  );

  return (
    <main>
      <EntranceJourney posters={posters} emptyMessage={loadError} />
    </main>
  );
}
