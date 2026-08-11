"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  adminManualReserveAction,
  cancelBookingAction,
  checkInAction,
  publishShowAction,
  toggleSeatBlockAction,
  updateShowAction,
  uploadPosterAction,
} from "@/app/actions/booking";
import { SeatMap } from "@/components/booking/SeatMap";
import type { BookingWithSeats, SeatWithAvailability, Show, ShowStatus } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500";

type AdminShowPanelProps = {
  show: Show;
  seats: SeatWithAvailability[];
  bookings: BookingWithSeats[];
};

export function AdminShowPanel({
  show,
  seats: initialSeats,
  bookings: initialBookings,
}: AdminShowPanelProps) {
  const router = useRouter();
  const [seats, setSeats] = useState(initialSeats);
  const [bookings, setBookings] = useState(initialBookings);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(show.status);
  const [message, setMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualContact, setManualContact] = useState("");
  const [posterUrl, setPosterUrl] = useState(show.poster_url);

  useEffect(() => {
    setSeats(initialSeats);
    setBookings(initialBookings);
    setStatus(show.status);
    setPosterUrl(show.poster_url);
  }, [initialSeats, initialBookings, show.status, show.poster_url]);

  const free = seats.filter((s) => s.availability === "available").length;
  const reserved = seats.filter((s) => s.availability === "reserved").length;
  const totalBookable = seats.filter((s) => s.availability !== "blocked").length;

  const selectedSeat =
    selectedIds.length === 1 ? seats.find((s) => s.id === selectedIds[0]) ?? null : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.guest_name.toLowerCase().includes(q) ||
        b.booking_code.toLowerCase().includes(q) ||
        (b.guest_contact ?? "").toLowerCase().includes(q),
    );
  }, [bookings, query]);

  const onSeatClick = (seatId: string) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat) return;
    if (seat.availability === "reserved") {
      setSelectedIds([seatId]);
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId],
    );
  };

  const setShowStatus = (next: ShowStatus) => {
    startTransition(async () => {
      await publishShowAction(show.id, next);
      setStatus(next);
      setMessage(`Статус: ${statusLabel(next)}`);
      router.refresh();
    });
  };

  const toggleBlock = () => {
    if (!selectedSeat || selectedSeat.availability === "reserved") return;
    const blocked = selectedSeat.status !== "blocked";
    startTransition(async () => {
      await toggleSeatBlockAction(selectedSeat.id, blocked);
      setSeats((prev) =>
        prev.map((s) =>
          s.id === selectedSeat.id
            ? {
                ...s,
                status: blocked ? "blocked" : "available",
                availability: blocked ? "blocked" : "available",
              }
            : s,
        ),
      );
      setSelectedIds([]);
      router.refresh();
    });
  };

  const cancelBooking = (bookingId: string) => {
    startTransition(async () => {
      await cancelBookingAction(bookingId);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setSeats((prev) =>
        prev.map((s) =>
          s.booking_id === bookingId
            ? {
                ...s,
                availability: "available",
                guest_name: undefined,
                booking_code: undefined,
                booking_id: undefined,
              }
            : s,
        ),
      );
      setSelectedIds([]);
      setMessage("Бронь отменена");
      router.refresh();
    });
  };

  const checkIn = (bookingId: string) => {
    startTransition(async () => {
      const result = await checkInAction(bookingId);
      if (result.ok && result.booking) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, ...result.booking! } : b)),
        );
      }
    });
  };

  const manualReserve = () => {
    if (!manualName.trim() || selectedIds.length === 0) {
      setMessage("Выберите места и укажите имя");
      return;
    }
    startTransition(async () => {
      const result = await adminManualReserveAction({
        showId: show.id,
        seatIds: selectedIds,
        guestName: manualName,
        guestContact: manualContact || undefined,
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setManualName("");
      setManualContact("");
      setSelectedIds([]);
      setMessage("Бронь создана");
      router.refresh();
    });
  };

  const saveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateShowAction(show.id, {
        title: String(fd.get("title") || ""),
        short_description: String(fd.get("short_description") || ""),
        description: String(fd.get("description") || ""),
        date: String(fd.get("date") || ""),
        start_time: String(fd.get("start_time") || ""),
        duration_minutes: Number(fd.get("duration_minutes") || 25),
        venue: String(fd.get("venue") || ""),
        poster_url: posterUrl,
      });
      if (result.ok) {
        setEditing(false);
        setMessage("Сохранено");
        router.refresh();
      }
    });
  };

  const onPoster = async (file: File | null) => {
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadPosterAction(fd);
    if (result.ok) setPosterUrl(result.url);
    else setMessage(result.message);
  };

  return (
    <div className="mt-8 space-y-10">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-700">
          {statusLabel(status)}
        </span>
        <Link
          href={`/shows/${show.slug}`}
          target="_blank"
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-100"
        >
          Посмотреть как гость ↗
        </Link>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm hover:bg-stone-100"
        >
          {editing ? "Скрыть форму" : "Редактировать"}
        </button>
      </div>

      <section className="flex flex-wrap gap-2">
        {(
          [
            ["published", "Опубликован"],
            ["draft", "Черновик"],
            ["cancelled", "Отменён"],
            ["archived", "Архив"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            disabled={pending || status === value}
            onClick={() => setShowStatus(value)}
            className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-stone-100"
          >
            {label}
          </button>
        ))}
      </section>

      {editing && (
        <form onSubmit={saveEdit} className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Редактирование
          </h2>
          <label className="block">
            <span className="mb-1 block text-sm text-stone-600">Название</span>
            <input name="title" defaultValue={show.title} required className={inputClass} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-stone-600">Дата</span>
              <input name="date" type="date" defaultValue={show.date} required className={inputClass} />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-stone-600">Время</span>
              <input
                name="start_time"
                type="time"
                defaultValue={show.start_time}
                required
                className={inputClass}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm text-stone-600">Длительность</span>
              <input
                name="duration_minutes"
                type="number"
                defaultValue={show.duration_minutes}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-stone-600">Место</span>
              <input name="venue" defaultValue={show.venue} className={inputClass} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm text-stone-600">Короткое описание</span>
            <textarea
              name="short_description"
              rows={2}
              defaultValue={show.short_description}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-stone-600">Полное описание</span>
            <textarea
              name="description"
              rows={4}
              defaultValue={show.description}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-stone-600">Афиша</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onPoster(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            {posterUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterUrl} alt="" className="mt-2 max-h-40 rounded object-contain" />
            )}
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Сохранить
          </button>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Бронирования
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {reserved} / {totalBookable}
          </p>
          <p className="mt-1 text-sm text-stone-500">Свободно: {free}</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Гости
          </p>
          <p className="mt-2 text-2xl font-semibold">{bookings.length}</p>
          <p className="mt-1 text-sm text-stone-500">активных броней</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Карта зала</h2>
        <p className="mt-1 text-sm text-stone-500">
          Зелёный — свободно · красный — занято · жёлтый — заблокировано. Клик: выбрать.
        </p>
        <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4">
          <SeatMap
            seats={seats}
            selectedIds={selectedIds}
            onToggle={onSeatClick}
            interactive
            mode="admin"
          />
        </div>

        {selectedSeat?.availability === "reserved" && (
          <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4 text-sm">
            <p className="font-medium">
              Место {selectedSeat.row_label}
              {selectedSeat.seat_number}
            </p>
            <p className="mt-2">Гость: {selectedSeat.guest_name}</p>
            {selectedSeat.booking_code && (
              <p className="text-stone-500">Код: {selectedSeat.booking_code}</p>
            )}
            {selectedSeat.booking_id && (
              <button
                type="button"
                disabled={pending}
                onClick={() => cancelBooking(selectedSeat.booking_id!)}
                className="mt-3 rounded-md border border-red-200 px-3 py-1.5 text-red-700 hover:bg-red-50"
              >
                Отменить бронь
              </button>
            )}
          </div>
        )}

        {selectedIds.length > 0 &&
          selectedIds.every((id) => {
            const s = seats.find((x) => x.id === id);
            return s && s.availability !== "reserved";
          }) && (
            <div className="mt-4 space-y-3 rounded-lg border border-stone-200 bg-white p-4">
              <p className="text-sm font-medium">
                Выбрано:{" "}
                {selectedIds
                  .map((id) => {
                    const s = seats.find((x) => x.id === id)!;
                    return `${s.row_label}${s.seat_number}`;
                  })
                  .join(", ")}
              </p>
              {selectedIds.length === 1 && selectedSeat?.availability !== "reserved" && (
                <button
                  type="button"
                  onClick={toggleBlock}
                  disabled={pending}
                  className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
                >
                  {selectedSeat?.status === "blocked"
                    ? "Разблокировать место"
                    : "Заблокировать место"}
                </button>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Имя гостя"
                  className={inputClass}
                />
                <input
                  value={manualContact}
                  onChange={(e) => setManualContact(e.target.value)}
                  placeholder="Контакт (необязательно)"
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={manualReserve}
                disabled={pending}
                className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Забронировать вручную
              </button>
            </div>
          )}
      </section>

      <section id="guests">
        <h2 className="text-lg font-semibold">Гости</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по имени, коду или контакту"
          className={`${inputClass} mt-3 max-w-md`}
        />
        <ul className="mt-4 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {filtered.map((b) => (
            <li key={b.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{b.guest_name}</p>
                <p className="text-stone-500">
                  места: {b.seats.map((s) => `${s.row_label}${s.seat_number}`).join(", ")}
                </p>
                {b.guest_contact && (
                  <p className="text-stone-500">{b.guest_contact}</p>
                )}
                <p className="font-mono text-xs text-stone-400">{b.booking_code}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {b.status === "reserved" && (
                  <button
                    type="button"
                    onClick={() => checkIn(b.id)}
                    disabled={pending}
                    className="rounded-md border border-stone-300 px-3 py-1.5 hover:bg-stone-50"
                  >
                    Пришёл
                  </button>
                )}
                {b.status === "checked_in" && (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                    Пришёл
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => cancelBooking(b.id)}
                  disabled={pending}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-red-700 hover:bg-red-50"
                >
                  Отменить бронь
                </button>
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-stone-500">Пока нет гостей</li>
          )}
        </ul>
      </section>

      {message && <p className="text-sm text-stone-600">{message}</p>}
    </div>
  );
}

function statusLabel(status: ShowStatus): string {
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
