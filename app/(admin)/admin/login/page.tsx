"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminLoginAction } from "@/app/actions/booking";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await adminLoginAction(password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold text-stone-900">Вход</h1>
      <p className="mt-1 text-sm text-stone-500">Админка театра Мии</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-stone-600">Пароль</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400"
            autoFocus
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-stone-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50"
        >
          {pending ? "Входим…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
