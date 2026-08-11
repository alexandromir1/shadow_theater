"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  checkInByCodeAction,
  lookupBookingByCodeAction,
} from "@/app/actions/booking";
import { formatShowDateTime } from "@/lib/mock/shows";
import type { BookingWithSeats } from "@/lib/types";

export function CheckInScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState<BookingWithSeats | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stopCamera = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const applyCode = useCallback(
    (raw: string) => {
      const cleaned = raw.trim().toUpperCase();
      const match = cleaned.match(/MIA-[A-Z0-9]+/);
      const value = match?.[0] ?? cleaned;
      if (!value) return;
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
    },
    [stopCamera],
  );

  const readQrFromImageData = (imageData: ImageData): string | null => {
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });
    return result?.data ?? null;
  };

  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    if (video.readyState >= 2 && video.videoWidth > 0) {
      const w = video.videoWidth;
      const h = video.videoHeight;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const value = readQrFromImageData(imageData);
        if (value) {
          applyCode(value);
          return;
        }
      }
    }

    rafRef.current = requestAnimationFrame(scanLoop);
  }, [applyCode]);

  const startCamera = async () => {
    setCameraError(null);
    setMessage(null);
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "Камера недоступна. Используйте «Сфотографировать QR» или введите код вручную.",
      );
      return;
    }

    try {
      // iOS Safari needs playsInline + secure context (HTTPS)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.muted = true;
      video.srcObject = stream;
      await video.play();
      setScanning(true);
      rafRef.current = requestAnimationFrame(scanLoop);
    } catch {
      setCameraError(
        "Не удалось открыть камеру. Разрешите доступ в настройках Safari или сфотографируйте QR.",
      );
      stopCamera();
    }
  };

  const onPhoto = async (file: File | null) => {
    if (!file) return;
    setCameraError(null);
    setMessage(null);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const value = readQrFromImageData(imageData);
      bitmap.close();
      if (!value) {
        setMessage("QR не распознан. Попробуйте ближе и при хорошем свете.");
        return;
      }
      applyCode(value);
    } catch {
      setMessage("Не удалось прочитать фото.");
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
          На iPhone удобнее: включить камеру или сфотографировать QR.
        </p>

        <div className="mt-4 overflow-hidden rounded-lg bg-stone-900">
          <video
            ref={videoRef}
            className={`aspect-[4/3] w-full object-cover ${scanning ? "block" : "hidden"}`}
            playsInline
            muted
            autoPlay
          />
          {!scanning && (
            <div className="flex aspect-[4/3] items-center justify-center px-4 text-center text-sm text-stone-400">
              Камера выключена
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" aria-hidden />

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
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm hover:bg-stone-50"
          >
            Сфотографировать QR
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void onPhoto(e.target.files?.[0] ?? null)}
          />
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
            autoCapitalize="characters"
            autoCorrect="off"
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
