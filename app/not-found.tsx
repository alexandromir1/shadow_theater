import Link from "next/link";
import { MagicButton } from "@/components/theater/MagicButton";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center magical-gradient">
      <h1 className="font-display text-4xl text-[var(--cream)]">Страница не найдена</h1>
      <p className="mt-3 text-[var(--cream-muted)]">Эта история ещё не написана.</p>
      <div className="mt-8">
        <MagicButton href="/">На главную</MagicButton>
      </div>
      <Link href="/admin" className="mt-6 text-sm text-[var(--cream-muted)]">
        Админка
      </Link>
    </main>
  );
}
