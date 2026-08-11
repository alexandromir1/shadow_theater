"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  createShowAction,
  uploadPosterAction,
} from "@/app/actions/booking";
import type { ShowStatus } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400";

export function CreateShowForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rows, setRows] = useState(4);
  const [perRow, setPerRow] = useState(5);

  const onFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    const result = await uploadPosterAction(fd);
    setUploading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPosterUrl(result.url);
  };

  const save = (status: ShowStatus) => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    setError(null);
    startTransition(async () => {
      const result = await createShowAction({
        title: String(fd.get("title") || ""),
        short_description: String(fd.get("short_description") || ""),
        description: String(fd.get("description") || ""),
        date: String(fd.get("date") || ""),
        start_time: String(fd.get("start_time") || ""),
        duration_minutes: Number(fd.get("duration_minutes") || 25),
        venue: String(fd.get("venue") || "Домашний театр теней"),
        row_count: Number(fd.get("row_count") || 4),
        seats_per_row: Number(fd.get("seats_per_row") || 5),
        poster_url: posterUrl,
        status,
      });
      if (!result.ok) {
        setError("Не удалось создать спектакль");
        return;
      }
      router.push(`/admin/shows/${result.show.id}`);
      router.refresh();
    });
  };

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        save("draft");
      }}
      className="mt-8 space-y-8"
    >
      <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Основное
        </h2>
        <Field name="title" label="Название" required placeholder="Лесная история" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="date" label="Дата" type="date" required />
          <Field name="start_time" label="Время" type="time" required defaultValue="18:00" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="duration_minutes"
            label="Продолжительность (мин)"
            type="number"
            defaultValue="25"
          />
          <Field name="venue" label="Место" defaultValue="Домашний театр теней" />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm text-stone-600">Короткое описание</span>
          <textarea
            name="short_description"
            rows={2}
            placeholder="Маленькая история о дружбе, храбрости и лунном свете."
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-stone-400">На афише</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-stone-600">Полное описание</span>
          <textarea
            name="description"
            rows={4}
            placeholder="В ночном лесу просыпаются тени зверей…"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-stone-400">На странице спектакля</span>
        </label>
      </section>

      <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Афиша спектакля
        </h2>
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFile(e.dataTransfer.files?.[0] ?? null);
          }}
          onClick={() => fileRef.current?.click()}
        >
          {posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={posterUrl}
              alt="Афиша"
              className="max-h-56 rounded-md object-contain"
            />
          ) : (
            <>
              <p className="text-sm text-stone-600">Перетащить изображение</p>
              <p className="mt-1 text-xs text-stone-400">или выбрать файл</p>
            </>
          )}
          {uploading && <p className="mt-2 text-xs text-stone-500">Загрузка…</p>}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
        {posterUrl && (
          <button
            type="button"
            className="text-sm text-stone-500 hover:text-stone-800"
            onClick={() => setPosterUrl(null)}
          >
            Убрать изображение
          </button>
        )}
      </section>

      <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          Зал
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm text-stone-600">Количество рядов</span>
            <input
              name="row_count"
              type="number"
              min={1}
              max={12}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value) || 1)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-stone-600">Мест в ряду</span>
            <input
              name="seats_per_row"
              type="number"
              min={1}
              max={20}
              value={perRow}
              onChange={(e) => setPerRow(Number(e.target.value) || 1)}
              className={inputClass}
            />
          </label>
        </div>
        <p className="text-sm text-stone-500">
          Итого мест: <strong className="text-stone-800">{rows * perRow}</strong>
        </p>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-100 disabled:opacity-50"
        >
          {pending ? "Сохраняем…" : "Сохранить как черновик"}
        </button>
        <button
          type="button"
          disabled={pending}
          className="rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
          onClick={() => save("published")}
        >
          Опубликовать
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-stone-600">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}
