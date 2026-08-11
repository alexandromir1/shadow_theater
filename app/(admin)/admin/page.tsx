import Link from "next/link";
import { redirect } from "next/navigation";
import { adminLogoutAction } from "@/app/actions/booking";
import { AdminNav } from "@/components/admin/AdminNav";
import { formatShowDateTime } from "@/lib/mock/shows";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { getShowStats, listAllShows } from "@/lib/db";
import type { Show } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const allShows = await listAllShows();
  const upcoming = allShows.filter(
    (s) => s.status === "published" && s.date >= new Date().toISOString().slice(0, 10),
  );
  const withStats = await Promise.all(
    upcoming.map(async (show) => ({
      show,
      stats: await getShowStats(show.id),
    })),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <AdminNav />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Театр Мии</h1>
      <p className="mt-1 text-sm text-stone-500">Предстоящие спектакли</p>

      <div className="mt-6 space-y-3">
        {withStats.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-600">
            Нет опубликованных спектаклей.{" "}
            <Link href="/admin/shows/new" className="font-medium text-stone-900 underline">
              Создать
            </Link>
          </div>
        )}
        {withStats.map(({ show, stats }) => (
          <ShowCard key={show.id} show={show} reserved={stats.reserved} total={stats.total} />
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/admin/shows/new"
          className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800"
        >
          Новый спектакль
        </Link>
        <Link
          href="/admin/shows"
          className="rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm hover:bg-stone-50"
        >
          Все спектакли
        </Link>
      </div>

      <form action={adminLogoutAction} className="mt-12">
        <button type="submit" className="text-sm text-stone-500 hover:text-stone-800">
          Выйти
        </button>
      </form>
    </main>
  );
}

function ShowCard({
  show,
  reserved,
  total,
}: {
  show: Show;
  reserved: number;
  total: number;
}) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5">
      <h2 className="text-lg font-semibold">{show.title}</h2>
      <p className="mt-1 text-sm text-stone-500">
        {formatShowDateTime(show.date, show.start_time)}
      </p>
      <p className="mt-3 text-sm">
        {reserved} / {total} мест забронировано
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/admin/shows/${show.id}`}
          className="rounded-md bg-stone-900 px-3 py-1.5 text-sm text-white hover:bg-stone-800"
        >
          Открыть
        </Link>
        <Link
          href={`/admin/shows/${show.id}`}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
        >
          Редактировать
        </Link>
        <Link
          href={`/shows/${show.slug}`}
          target="_blank"
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
        >
          Как гость ↗
        </Link>
      </div>
    </article>
  );
}
