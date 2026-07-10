import { prisma } from "../src/lib/db";

async function main() {
  const tables = await prisma.table.findMany({ select: { id: true, number: true } });
  console.log(tables);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
