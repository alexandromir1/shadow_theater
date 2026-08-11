import Link from "next/link";

const link =
  "text-stone-600 hover:text-stone-900 transition-colors";

export function AdminNav() {
  return (
    <nav className="flex flex-wrap items-center gap-4 border-b border-stone-200 pb-4 text-sm">
      <Link href="/admin" className="text-base font-semibold text-stone-900">
        Театр Мии
      </Link>
      <Link href="/admin" className={link}>
        Главная
      </Link>
      <Link href="/admin/shows" className={link}>
        Спектакли
      </Link>
      <Link
        href="/admin/shows/new"
        className="rounded-md bg-stone-900 px-3 py-1.5 text-white hover:bg-stone-800"
      >
        Новый спектакль
      </Link>
      <Link href="/" className={`ml-auto ${link}`} target="_blank">
        Сайт ↗
      </Link>
    </nav>
  );
}
