-- Seed shows

insert into public.shows (
  title, slug, description, date, start_time, duration_minutes, venue, status, row_count, seats_per_row
) values
(
  'Лесная история',
  'lesnaya-istoriya',
  'В ночном лесу просыпаются тени зверей. Маленькая история о храбрости, дружбе и лунном свете.',
  '2026-08-15',
  '18:00',
  25,
  'Домашний театр теней',
  'published',
  3,
  5
),
(
  'Друзья луны',
  'druzya-luny',
  'Маленькие звёзды потерялись. Вместе с луной они ищут дорогу домой.',
  '2026-08-22',
  '17:30',
  20,
  'Домашний театр теней',
  'published',
  3,
  4
);
