import { EntranceJourney } from "@/components/home/EntranceJourney";
import { listPublishedShows, getShowStats } from "@/lib/db";
import { MOCK_SHOWS } from "@/lib/mock/shows";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let shows = MOCK_SHOWS;
  try {
    const fromDb = await listPublishedShows();
    if (fromDb.length > 0) shows = fromDb;
  } catch {
    shows = MOCK_SHOWS;
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
