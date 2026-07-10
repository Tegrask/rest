import { prisma } from "@/lib/db";
import { formatCents } from "@/lib/format";
import Link from "next/link";
import { ClipboardList, DollarSign, ChefHat } from "lucide-react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    openOrders,
    todayPaid,
    todayRevenue,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        status: { notIn: ["SERVED", "CANCELLED"] },
      },
    }),
    prisma.order.count({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: today },
      },
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: "PAID",
        createdAt: { gte: today },
      },
      _sum: { total: true },
    }),
  ]);

  const revenue = todayRevenue._sum.total || 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-zinc-500">Übersicht für heute</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/orders"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2 text-orange-600">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Offene Bestellungen</p>
              <p className="text-2xl font-semibold">{openOrders}</p>
            </div>
          </div>
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2 text-green-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Bezahlte Bestellungen</p>
              <p className="text-2xl font-semibold">{todayPaid}</p>
            </div>
          </div>
        </div>

        <Link
          href="/admin/analytics"
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-zinc-500">Umsatz heute</p>
              <p className="text-2xl font-semibold">{formatCents(revenue)}</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
