import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  await requireAuth();

  const tables = await prisma.table.findMany({
    orderBy: { number: "asc" },
  });

  return Response.json(tables);
}
