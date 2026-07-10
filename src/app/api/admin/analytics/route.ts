import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  await requireAuth();

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7", 10);

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "PAID",
      createdAt: { gte: start, lte: end },
    },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, { date: string; revenue: number; orders: number }>();

  for (let i = 0; i <= days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    map.set(key, { date: key, revenue: 0, orders: 0 });
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().split("T")[0];
    const entry = map.get(key);
    if (entry) {
      entry.revenue += order.total;
      entry.orders += 1;
    }
  }

  return Response.json(Array.from(map.values()));
}
