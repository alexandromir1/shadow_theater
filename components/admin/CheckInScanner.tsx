"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  checkInByCodeAction,
  lookupBookingByCodeAction,
} from "@/app/actions/booking";
import { formatShowDateTime } from "@/lib/mock/shows";
import type { BookingWithSeats } from "@/lib/types";

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
};

export function CheckInScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState<BookingWithSeats | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const applyCode = (raw: string) => {
    const cleaned = raw.trim().toUpperCase();
    // Accept plain MIA-XXXX or URL ending with the code
    const match = cleaned.match(/MIA-[A-Z0-9]+/);
    const value = match?.[0] ?? cleaned;
    setCode(value);
    setMessage(null);
    startTransition(async () => {
      const result = await lookupBookingByCodeAction(value);
      if (!result.ok) {
        setBooking(null);
        setMessage(result.message);
        return;
      }
      setBooking(result.booking);
      setMessage(null);
      stopCamera();
    });
  };

  const startCamera = async () => {
    setCameraError(null);
    setMessage(null);
    try {
      const Detector = (
        window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
        }
      ).BarcodeDetector;

      if (!Detector) {
        setCameraError(
          "Камера-сканер не поддерживается в этом браузере. Введите код вручную или откройте на телефоне Chrome / Safari.",
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setScanning(true);

      const detector = new Detector({ formats: ["qr_code"] });
      let active = true;

      const tick = async () => {
        if (!active || !streamRef.current) return;
        try {
          if (video.readyState >= 2) {
            const codes = await detector.detect(video);
            if (codes[0]?.rawValue) {
              active = false;
              applyCode(codes[0].rawValue);
              return;
            }
          }
        } catch {
          // keep scanning
        }
        requestAnimationFrame(() => void tick());
      };
      void tick();
    } catch {
      setCameraError("Не удалось открыть камеру. Разрешите доступ или введите код вручную.");
      stopCamera();
    }
  };

  const onLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    applyCode(code);
  };

  const onCheckIn = () => {
    if (!code.trim()) return;
    startTransition(async () => {
      const result = await checkInByCodeAction(code);
      if (!result.ok) {
        setMessage(result.message ?? "Не удалось отметить");
        if ("booking" in result && result.booking) setBooking(result.booking);
        return;
      }
      setBooking(result.booking);
      setMessage(result.already ? "Уже отмечен как пришедший" : "Гость отмечен ✓");
    });
  };

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Сканер QR
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Наведите камеру на QR с билета — или введите код вручную.
        </p>

        <div className="mt-4 overflow-hidden rounded-lg bg-stone-900">
          <video
            ref={videoRef}
            className={`aspect-[4/3] w-full object-cover ${scanning ? "block" : "hidden"}`}
            playsInline
            muted
          />
          {!scanning && (
            <div className="flex aspect-[4/3] items-center justify-center text-sm text-stone-400">
              Камера выключена
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {!scanning ? (
            <button
              type="button"
              onClick={() => void startCamera()}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white hover:bg-stone-800"
            >
              Включить камеру
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-md border border-stone-300 px-4 py-2 text-sm hover:bg-stone-50"
            >
              Выключить камеру
            </button>
          )}
        </div>
        {cameraError && <p className="mt-2 text-sm text-amber-700">{cameraError}</p>}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Код билета
        </h2>
        <form onSubmit={onLookup} className="mt-3 flex flex-wrap gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="MIA-XXXX"
            className="min-w-[12rem] flex-1 rounded-md border border-stone-300 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-stone-500"
          />
          <button
            type="submit"
            disabled={pending || !code.trim()}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm hover:bg-stone-50 disabled:opacity-50"
          >
            Найти
          </button>
        </form>
      </section>

      {message && (
        <p className="text-sm text-stone-700" role="status">
          {message}
        </p>
      )}

      {booking && (
        <section className="rounded-lg border border-stone-200 bg-white p-5">
          <p className="font-mono text-sm text-stone-500">{booking.booking_code}</p>
          <h3 className="mt-1 text-xl font-semibold">{booking.guest_name}</h3>
          {booking.show && (
            <p className="mt-1 text-sm text-stone-600">
              {booking.show.title} ·{" "}
              {formatShowDateTime(booking.show.date, booking.show.start_time)}
            </p>
          )}
          <p className="mt-3 text-sm">
            Места:{" "}
            {booking.seats.map((s) => `${s.row_label}${s.seat_number}`).join(", ")}
          </p>
          {booking.guest_contact && (
            <p className="mt-1 text-sm text-stone-500">{booking.guest_contact}</p>
          )}
          <p className="mt-3 text-sm">
            Статус:{" "}
            <strong>
              {booking.status === "checked_in"
                ? "Пришёл"
                : booking.status === "cancelled"
                  ? "Отменён"
                  : "Ожидается"}
            </strong>
          </p>

          {booking.status === "reserved" && (
            <button
              type="button"
              onClick={onCheckIn}
              disabled={pending}
              className="mt-4 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              ✓ Пришёл
            </button>
          )}
        </section>
      )}
    </div>
  );
}
