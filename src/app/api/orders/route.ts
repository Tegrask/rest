import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { orderBroadcaster } from "@/lib/sse";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const createOrderSchema = z.object({
  tableId: z.string().min(1),
  items: z.array(
    z.object({
      menuItemId: z.string().min(1),
      quantity: z.number().int().min(1),
    })
  ).min(1),
});

export async function GET(request: Request) {
  await requireAuth();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const date = searchParams.get("date");

  const where: { status?: string; createdAt?: { gte: Date; lt: Date } } = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    where.createdAt = { gte: d, lt: next };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      table: true,
      items: { include: { menuItem: true } },
    },
  });

  return Response.json(orders);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableId, items } = createOrderSchema.parse(body);

    const menuItemIds = items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (menuItems.length !== menuItemIds.length) {
      return Response.json({ error: "Menu item not found" }, { status: 400 });
    }

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));
    const total = items.reduce((sum, i) => {
      const item = menuItemMap.get(i.menuItemId);
      return sum + (item?.price || 0) * i.quantity;
    }, 0);

    const order = await prisma.order.create({
      data: {
        tableId,
        total,
        status: "PENDING",
        items: {
          create: items.map((i) => {
            const item = menuItemMap.get(i.menuItemId)!;
            return {
              menuItemId: i.menuItemId,
              quantity: i.quantity,
              name: item.name,
              price: item.price,
            };
          }),
        },
      },
      include: {
        table: true,
        items: { include: { menuItem: true } },
      },
    });

    orderBroadcaster.broadcast({ type: "NEW_ORDER", order });

    return Response.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error("Order creation error", error);
    return Response.json({ error: "Failed to create order" }, { status: 500 });
  }
}
