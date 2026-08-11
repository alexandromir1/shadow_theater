import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminShowPanel } from "@/components/admin/AdminShowPanel";
import { formatShowDateTime } from "@/lib/mock/shows";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { getSeatsForShow, getShowById, getShowStats, listBookingsForShow } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminShowDetailPage({ params }: Props) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { id } = await params;
  const show = await getShowById(id);
  if (!show) notFound();

  const [seats, bookings, stats] = await Promise.all([
    getSeatsForShow(show.id),
    listBookingsForShow(show.id),
    getShowStats(show.id),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <AdminNav />
      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{show.title}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {formatShowDateTime(show.date, show.start_time)} · {show.venue}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {stats.reserved} / {stats.total} мест · свободно{" "}
            {Math.max(0, stats.total - stats.reserved)}
          </p>
        </div>
        <Link
          href={`/shows/${show.slug}`}
          target="_blank"
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm hover:bg-stone-50"
        >
          Посмотреть как гость ↗
        </Link>
      </div>
      <AdminShowPanel show={show} seats={seats} bookings={bookings} />
    </main>
  );
}
