import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell min-h-screen bg-stone-50 text-stone-900 antialiased">
      {children}
    </div>
  );
}
