import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { CreateShowForm } from "@/components/admin/CreateShowForm";
import { isAdminAuthenticated } from "@/lib/auth/admin";

export default async function NewShowPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  return (
    <main className="mx-auto max-w-xl px-6 py-10">
      <AdminNav />
      <h1 className="mt-8 text-2xl font-semibold">Новый спектакль</h1>
      <p className="mt-1 text-sm text-stone-500">
        После сохранения появится схема зала и можно будет бронировать места.
      </p>
      <CreateShowForm />
    </main>
  );
}
