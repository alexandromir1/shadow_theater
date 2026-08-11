"use client";

import { motion, useReducedMotion as useFramerReduced } from "motion/react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { formatShowDateTime } from "@/lib/mock/shows";
import type { BookingWithSeats, Show } from "@/lib/types";

type TicketCardProps = {
  booking: BookingWithSeats;
  show: Show;
};

export function TicketCard({ booking, show }: TicketCardProps) {
  const reduced = useFramerReduced();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const seatsLabel = booking.seats
    .map((s) => `${s.row_label}${s.seat_number}`)
    .sort()
    .join(" · ");

  useEffect(() => {
    let cancelled = false;
    // Payload = booking code only — tiny QR, easy to scan, no server load
    void QRCode.toDataURL(booking.booking_code, {
      width: 220,
      margin: 1,
      color: { dark: "#1a1230", light: "#fffef8" },
      errorCorrectionLevel: "M",
    }).then((url) => {
      if (!cancelled) setQrUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [booking.booking_code]);

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const downloadQr = () => {
    if (!qrUrl) return;
    downloadDataUrl(qrUrl, `qr-${booking.booking_code}.png`);
  };

  const downloadTicket = async () => {
    if (!qrUrl) return;
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      const w = 720;
      const h = 1100;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#2a1b5e");
      grad.addColorStop(1, "#0c0a24");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(201,164,92,0.55)";
      ctx.lineWidth = 2;
      ctx.strokeRect(28, 28, w - 56, h - 56);

      ctx.fillStyle = "#c9a45c";
      ctx.font = "24px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText("ТЕАТР ТЕНЕЙ МИИ", w / 2, 100);

      ctx.fillStyle = "#f5f0d8";
      ctx.font = "bold 44px Georgia, serif";
      ctx.fillText(`«${show.title}»`, w / 2, 180);

      ctx.fillStyle = "#d8cbb0";
      ctx.font = "28px Georgia, serif";
      ctx.fillText(formatShowDateTime(show.date, show.start_time), w / 2, 240);
      ctx.font = "22px Georgia, serif";
      ctx.fillText(show.venue, w / 2, 280);

      ctx.fillStyle = "#f5f0d8";
      ctx.font = "30px Georgia, serif";
      const seatLines = booking.seats
        .map((s) => `Ряд ${s.row_label} · Место ${s.seat_number}`)
        .join("  ·  ");
      ctx.fillText(seatLines.slice(0, 42), w / 2, 360);
      if (seatLines.length > 42) {
        ctx.fillText(seatLines.slice(42, 84), w / 2, 400);
      }

      ctx.fillStyle = "#c9a45c";
      ctx.font = "bold 36px monospace";
      ctx.fillText(booking.booking_code, w / 2, 470);

      ctx.fillStyle = "#d8cbb0";
      ctx.font = "26px Georgia, serif";
      ctx.fillText(booking.guest_name, w / 2, 520);

      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject();
        qrImg.src = qrUrl;
      });
      const qrSize = 280;
      ctx.drawImage(qrImg, (w - qrSize) / 2, 560, qrSize, qrSize);

      ctx.fillStyle = "#d8cbb0";
      ctx.font = "22px Georgia, serif";
      ctx.fillText("Покажите этот QR на входе", w / 2, 900);
      ctx.fillText("До встречи в театре", w / 2, 980);

      downloadDataUrl(canvas.toDataURL("image/png"), `bilet-${booking.booking_code}.png`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <motion.div
        ref={ticketRef}
        className="poster-frame relative overflow-hidden rounded-sm px-8 py-10 text-center"
        style={{
          background:
            "linear-gradient(165deg, rgba(42,27,94,0.75) 0%, rgba(12,10,36,0.95) 100%)",
        }}
        initial={reduced ? false : { rotateX: 8, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--gold)]">Театр теней</p>
        <p className="mt-1 font-display text-2xl text-[var(--cream)]">Мии</p>
        <div className="my-6 h-px bg-gradient-to-r from-transparent via-[rgba(201,164,92,0.4)] to-transparent" />
        <h2 className="font-display text-2xl text-[var(--gold-soft)]">«{show.title}»</h2>
        <p className="mt-4 text-[var(--cream-muted)]">
          {formatShowDateTime(show.date, show.start_time)}
        </p>
        <p className="mt-2 text-sm text-[var(--cream-muted)]">{show.venue}</p>
        <p className="mt-6 font-display text-lg text-[var(--cream)]">
          {booking.seats.map((s) => `Ряд ${s.row_label} · Место ${s.seat_number}`).join(", ")}
        </p>
        <p className="mt-1 text-xs text-[var(--cream-muted)]">{seatsLabel}</p>
        <p className="mt-6 font-display text-xl tracking-[0.2em] text-[var(--gold)]">
          {booking.booking_code}
        </p>
        <p className="mt-2 text-sm text-[var(--cream-muted)]">{booking.guest_name}</p>

        {qrUrl && (
          <div className="mx-auto mt-6 inline-block rounded-sm bg-[#fffef8] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt={`QR ${booking.booking_code}`} width={180} height={180} />
          </div>
        )}

        <p className="mt-4 text-sm text-[var(--cream)]">Покажите QR на входе</p>
        <p className="mt-2 text-sm text-[var(--cream-muted)]">До встречи в театре</p>
        <div className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />
      </motion.div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={downloadTicket}
          disabled={!qrUrl || saving}
          className="rounded-sm bg-[var(--gold)] px-4 py-2.5 text-sm font-medium text-[var(--night-950)] disabled:opacity-50"
        >
          {saving ? "Сохраняем…" : "Скачать билет"}
        </button>
        <button
          type="button"
          onClick={downloadQr}
          disabled={!qrUrl}
          className="rounded-sm border border-[rgba(201,164,92,0.45)] px-4 py-2.5 text-sm text-[var(--gold)] disabled:opacity-50"
        >
          Только QR
        </button>
      </div>
    </div>
  );
}
