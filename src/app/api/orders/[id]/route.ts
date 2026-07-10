import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { orderBroadcaster } from "@/lib/sse";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const updateSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED"]).optional(),
  paymentMethod: z.enum(["CASH", "NXCODE"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      table: true,
      items: { include: { menuItem: true } },
      payments: true,
    },
  });

  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  return Response.json(order);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();
  const { id } = await params;

  try {
    const body = await request.json();
    const update = updateSchema.parse(body);

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(update.status && { status: update.status }),
        ...(update.paymentStatus && { paymentStatus: update.paymentStatus }),
        ...(update.paymentMethod && { paymentMethod: update.paymentMethod }),
      },
      include: {
        table: true,
        items: { include: { menuItem: true } },
      },
    });

    orderBroadcaster.broadcast({ type: "ORDER_UPDATED", order });

    return Response.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error("Order update error", error);
    return Response.json({ error: "Failed to update order" }, { status: 500 });
  }
}
