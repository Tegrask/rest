import { prisma } from "@/lib/db";
import { chargeNxcode } from "@/lib/payment";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const paymentSchema = z.object({
  orderId: z.string().min(1),
  token: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, token } = paymentSchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { table: true },
    });

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "PAID") {
      return Response.json({ error: "Order already paid" }, { status: 400 });
    }

    const result = await chargeNxcode({
      orderId,
      amount: order.total,
      description: `Bestellung Tisch ${order.table.number}`,
      token: token || "",
    });

    if (!result.success) {
      await prisma.payment.create({
        data: {
          orderId,
          amount: order.total,
          provider: "NXCODE",
          status: "FAILED",
        },
      });
      return Response.json({ error: result.error || "Payment failed" }, { status: 402 });
    }

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          orderId,
          amount: order.total,
          provider: token ? "NXCODE" : "DEMO",
          status: "PAID",
          transactionId: result.transactionId,
          paidAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", paymentMethod: token ? "NXCODE" : "DEMO" },
      }),
    ]);

    return Response.json({ success: true, transactionId: result.transactionId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error("Payment error", error);
    return Response.json({ error: "Payment failed" }, { status: 500 });
  }
}
