import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { CheckInScanner } from "@/components/admin/CheckInScanner";
import { isAdminAuthenticated } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminCheckInPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <AdminNav />
      <h1 className="mt-8 text-2xl font-semibold">Проверка билетов</h1>
      <p className="mt-1 text-sm text-stone-500">
        Сканируйте QR с телефона гостя или введите код MIA-…
      </p>
      <CheckInScanner />
    </main>
  );
}
