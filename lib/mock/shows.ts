import type { Show } from "@/lib/types";

export const MOCK_SHOWS: Show[] = [
  {
    id: "show-forest-story",
    title: "Лесная история",
    slug: "lesnaya-istoriya",
    short_description: "Маленькая история о дружбе, храбрости и лунном свете.",
    description:
      "В ночном лесу просыпаются тени зверей. Маленькая история о храбрости, дружбе и лунном свете.",
    poster_url: null,
    hero_url: null,
    date: "2026-08-15",
    start_time: "18:00",
    duration_minutes: 25,
    venue: "Домашний театр теней",
    status: "published",
    capacity: 15,
    row_count: 3,
    seats_per_row: 5,
    created_at: "2026-08-01T10:00:00.000Z",
    updated_at: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "show-moon-friends",
    title: "Друзья луны",
    slug: "druzya-luny",
    short_description: "Звёзды ищут дорогу домой вместе с луной.",
    description:
      "Маленькие звёзды потерялись. Вместе с луной они ищут дорогу домой.",
    poster_url: null,
    hero_url: null,
    date: "2026-08-22",
    start_time: "17:30",
    duration_minutes: 20,
    venue: "Домашний театр теней",
    status: "published",
    capacity: 12,
    row_count: 3,
    seats_per_row: 4,
    created_at: "2026-08-01T10:00:00.000Z",
    updated_at: "2026-08-01T10:00:00.000Z",
  },
];

export function formatShowDate(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

export function formatShowDateTime(date: string, time: string): string {
  return `${formatShowDate(date)} · ${time}`;
}

export function seatsLabel(n: number): string {
  if (n <= 0) return "Мест нет";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} место свободно`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} места свободно`;
  }
  return `${n} мест свободно`;
}
