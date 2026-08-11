import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { formatShowDateTime } from "@/lib/mock/shows";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { getShowStats, listAllShows } from "@/lib/db";
import type { Show, ShowStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

function statusRu(status: ShowStatus) {
  switch (status) {
    case "published":
      return "Опубликован";
    case "draft":
      return "Черновик";
    case "archived":
      return "Архив";
    case "cancelled":
      return "Отменён";
  }
}

function groupShows(shows: Show[]) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming: Show[] = [];
  const drafts: Show[] = [];
  const archived: Show[] = [];
  const cancelled: Show[] = [];

  for (const show of shows) {
    if (show.status === "draft") drafts.push(show);
    else if (show.status === "cancelled") cancelled.push(show);
    else if (show.status === "archived") archived.push(show);
    else if (show.status === "published" && show.date >= today) upcoming.push(show);
    else archived.push(show);
  }
  return { upcoming, drafts, archived, cancelled };
}

export default async function AdminShowsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const shows = await listAllShows();
  const groups = groupShows(shows);

  const withStats = async (list: Show[]) =>
    Promise.all(
      list.map(async (show) => ({
        show,
        stats: await getShowStats(show.id),
      })),
    );

  const sections = [
    { title: "Предстоящие", items: await withStats(groups.upcoming) },
    { title: "Черновики", items: await withStats(groups.drafts) },
    { title: "Архив", items: await withStats(groups.archived) },
    { title: "Отменённые", items: await withStats(groups.cancelled) },
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <AdminNav />
      <div className="mt-8 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Спектакли</h1>
        <Link
          href="/admin/shows/new"
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
        >
          Новый спектакль
        </Link>
      </div>

      <div className="mt-8 space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              {section.title}
            </h2>
            {section.items.length === 0 ? (
              <p className="mt-3 text-sm text-stone-400">Пусто</p>
            ) : (
              <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
                {section.items.map(({ show, stats }) => (
                  <li key={show.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <Link
                        href={`/admin/shows/${show.id}`}
                        className="font-medium hover:underline"
                      >
                        {show.title}
                      </Link>
                      <p className="text-sm text-stone-500">
                        {formatShowDateTime(show.date, show.start_time)} · {statusRu(show.status)}
                      </p>
                      <p className="text-xs text-stone-400">
                        {stats.reserved}/{stats.total} мест
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/shows/${show.id}`}
                        className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
                      >
                        Открыть
                      </Link>
                      <Link
                        href={`/shows/${show.slug}`}
                        target="_blank"
                        className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
                      >
                        Как гость
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
