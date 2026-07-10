import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "@/components/logout-button";
import { LayoutDashboard, ClipboardList, BarChart3, QrCode } from "lucide-react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth().catch(() => null);
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full border-b border-zinc-200 bg-white md:w-64 md:border-b-0 md:border-r">
        <div className="p-6">
          <h1 className="text-lg font-semibold">Admin</h1>
          <p className="text-sm text-zinc-500">{session.name || session.email}</p>
        </div>
        <nav className="space-y-1 px-4 pb-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            <ClipboardList className="h-4 w-4" />
            Bestellungen
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            <BarChart3 className="h-4 w-4" />
            Umsatz
          </Link>
          <Link
            href="/admin/tables"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            <QrCode className="h-4 w-4" />
            QR-Codes
          </Link>
          <div className="pt-4">
            <LogoutButton />
          </div>
        </nav>
      </aside>
      <main className="flex-1 bg-zinc-50 p-6">{children}</main>
    </div>
  );
}
