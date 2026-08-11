"use server";

import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import {
  cancelBooking,
  checkInBooking,
  createShow,
  getBookingByCode,
  getBookingById,
  getShowById,
  isSupabaseConfigured,
  reserveSeats,
  setSeatBlocked,
  updateShow,
  updateShowStatus,
  type CreateShowInput,
  type UpdateShowInput,
} from "@/lib/db";
import {
  clearAdminSession,
  createAdminSession,
  isAdminAuthenticated,
  verifyAdminPassword,
} from "@/lib/auth/admin";
import { track } from "@/lib/analytics";
import type { ShowStatus } from "@/lib/types";

export async function reserveBookingAction(input: {
  showId: string;
  seatIds: string[];
  guestName: string;
  guestContact?: string;
}) {
  track("booking_started", { showId: input.showId });
  const result = await reserveSeats(input);
  if (result.ok) {
    track("booking_completed", {
      showId: input.showId,
      bookingId: result.booking.id,
      showTitle: result.booking.show?.title,
    });
    revalidatePath(`/`);
    revalidatePath(`/shows/${result.booking.show?.slug ?? ""}`);
    revalidatePath(`/admin`);
  }
  return result;
}

export async function cancelBookingAction(bookingId: string) {
  await requireAdmin();
  const booking = await getBookingById(bookingId);
  const ok = await cancelBooking(bookingId);
  if (ok) {
    track("booking_cancelled", { bookingId, showId: booking?.show_id });
    revalidatePath(`/shows/${booking?.show?.slug ?? ""}`);
    revalidatePath(`/admin`);
    if (booking?.show_id) revalidatePath(`/admin/shows/${booking.show_id}`);
  }
  return { ok };
}

export async function adminManualReserveAction(input: {
  showId: string;
  seatIds: string[];
  guestName: string;
  guestContact?: string;
}) {
  await requireAdmin();
  const result = await reserveSeats(input, { admin: true });
  if (result.ok) {
    revalidatePath(`/`);
    revalidatePath(`/shows/${result.booking.show?.slug ?? ""}`);
    revalidatePath(`/admin/shows/${input.showId}`);
  }
  return result;
}

export async function adminLoginAction(password: string) {
  const valid = await verifyAdminPassword(password);
  if (!valid) return { ok: false as const, message: "Неверный пароль" };
  await createAdminSession();
  return { ok: true as const };
}

export async function adminLogoutAction() {
  await clearAdminSession();
  const { redirect } = await import("next/navigation");
  redirect("/admin/login");
}

export async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) throw new Error("Unauthorized");
}

export async function checkInAction(bookingId: string) {
  await requireAdmin();
  const booking = await checkInBooking(bookingId);
  if (booking) {
    track("check_in_completed", { bookingId, showId: booking.show_id });
  }
  revalidatePath("/admin");
  revalidatePath("/admin/check-in");
  return { ok: Boolean(booking), booking };
}

export async function lookupBookingByCodeAction(code: string) {
  await requireAdmin();
  const booking = await getBookingByCode(code);
  if (!booking) {
    return { ok: false as const, message: "Билет не найден" };
  }
  return { ok: true as const, booking };
}

export async function checkInByCodeAction(code: string) {
  await requireAdmin();
  const booking = await getBookingByCode(code);
  if (!booking) {
    return { ok: false as const, message: "Билет не найден" };
  }
  if (booking.status === "cancelled") {
    return { ok: false as const, message: "Бронь отменена", booking };
  }
  if (booking.status === "checked_in") {
    return { ok: true as const, already: true as const, booking };
  }
  const updated = await checkInBooking(booking.id);
  if (updated) {
    track("check_in_completed", { bookingId: booking.id, showId: booking.show_id });
  }
  revalidatePath("/admin");
  revalidatePath("/admin/check-in");
  const fresh = await getBookingByCode(code);
  return { ok: Boolean(fresh), already: false as const, booking: fresh ?? booking };
}

export async function createShowAction(input: CreateShowInput) {
  await requireAdmin();
  const show = await createShow(input);
  track("admin_show_created", { showId: show.id, showTitle: show.title });
  revalidatePath("/");
  revalidatePath("/admin");
  return { ok: true as const, show };
}

export async function updateShowAction(showId: string, input: UpdateShowInput) {
  await requireAdmin();
  const show = await updateShow(showId, input);
  revalidatePath("/");
  if (show) {
    revalidatePath(`/shows/${show.slug}`);
    revalidatePath(`/admin/shows/${showId}`);
  }
  return { ok: Boolean(show), show };
}

export async function publishShowAction(showId: string, status: ShowStatus) {
  await requireAdmin();
  const show = await updateShowStatus(showId, status);
  revalidatePath("/");
  revalidatePath("/admin");
  if (show) revalidatePath(`/shows/${show.slug}`);
  return { ok: Boolean(show), show };
}

export async function toggleSeatBlockAction(seatId: string, blocked: boolean) {
  await requireAdmin();
  const seat = await setSeatBlocked(seatId, blocked);
  if (seat) {
    const show = await getShowById(seat.show_id);
    revalidatePath("/admin");
    if (show) {
      revalidatePath(`/admin/shows/${show.id}`);
      revalidatePath(`/shows/${show.slug}`);
      revalidatePath("/");
    }
  }
  return { ok: Boolean(seat), seat };
}

export async function uploadPosterAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false as const, message: "Выберите файл" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false as const, message: "Нужно изображение" };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false as const, message: "Максимум 5 МБ" };
  }

  if (isSupabaseConfigured()) {
    try {
      const { uploadShowAsset } = await import("@/lib/db/supabase");
      const url = await uploadShowAsset(file);
      return { ok: true as const, url };
    } catch {
      return { ok: false as const, message: "Не удалось загрузить в Storage" };
    }
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const name = `poster-${randomBytes(6).toString("hex")}.${safeExt}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, name), buffer);
  const url = `/uploads/${name}`;
  return { ok: true as const, url };
}
