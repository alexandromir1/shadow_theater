# Театр теней Мии

Цифровой дом маленького детского театра теней: афиша, выбор мест и бронирование без оплаты.

## Локально

```bash
npm install
cp .env.example .env.local
npm run dev
```

Без ключей Supabase работает demo-режим (`.data/store.json`) — только для разработки.

Админка: `/admin` · пароль из `ADMIN_PASSWORD` (по умолчанию в примере).

## Деплой на Vercel

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. **SQL Editor** → New query → вставьте весь файл [`supabase/setup.sql`](supabase/setup.sql) → **Run**
3. Project Settings → API / API Keys скопируйте:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Publishable key (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Secret key (`sb_secret_…`) → `SUPABASE_SECRET_KEY`  
     (никогда не коммитьте secret в git и не светите в клиентском коде)

   Legacy-ключи `anon` / `service_role` тоже поддерживаются.

Bucket `show-assets` создаётся скриптом автоматически.

### 2. Vercel

1. Залейте репозиторий на GitHub
2. [vercel.com/new](https://vercel.com/new) → Import проекта
3. Framework Preset: **Next.js** (определится сам)
4. Environment Variables:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://….supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` |
| `ADMIN_PASSWORD` | свой надёжный пароль |

5. Deploy

### 3. Проверка после деплоя

1. Откройте сайт → афиша (если seed прошёл — «Лесная история»)
2. `/admin/login` → пароль из `ADMIN_PASSWORD`
3. Создайте спектакль, загрузите афишу, опубликуйте
4. «Посмотреть как гость» → забронируйте места
5. В админке проверьте гостя и отмену брони

### Важно

- Без Supabase на Vercel бронирования **не сохранятся** (файловая система эфемерна).
- `SUPABASE_SECRET_KEY` нужен серверу для админки и атомарных броней.
- После смены env в Vercel сделайте Redeploy.

## Стек

Next.js · Tailwind · Motion · Supabase (Postgres + Storage)

## Сценарии

- Гость: главная → афиша → спектакль → места → имя → подтверждение
- Админ: вход → спектакли → зал / гости / ручная бронь
