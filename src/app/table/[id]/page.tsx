import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import MenuClient from "./menu-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TablePage({ params }: Props) {
  const { id } = await params;
  const tableNumber = parseInt(id, 10);

  const table = await prisma.table.findFirst({
    where: { number: tableNumber },
  });

  if (!table) {
    notFound();
  }

  return <MenuClient table={table} />;
}
