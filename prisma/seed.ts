import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin", 10);
  const staffPassword = await bcrypt.hash("kellner", 10);

  await prisma.user.upsert({
    where: { email: "admin@restaurant.local" },
    update: {},
    create: { email: "admin@restaurant.local", name: "Admin", role: "ADMIN", password: adminPassword },
  });

  await prisma.user.upsert({
    where: { email: "kellner@restaurant.local" },
    update: {},
    create: { email: "kellner@restaurant.local", name: "Kellner", role: "STAFF", password: staffPassword },
  });

  await prisma.table.upsert({
    where: { number: 1 },
    update: {},
    create: { number: 1, name: "Tisch 1" },
  });
  await prisma.table.upsert({
    where: { number: 2 },
    update: {},
    create: { number: 2, name: "Tisch 2" },
  });
  await prisma.table.upsert({
    where: { number: 3 },
    update: {},
    create: { number: 3, name: "Tisch 3" },
  });

  const starters = await prisma.category.upsert({
    where: { id: "cat-starters" },
    update: {},
    create: { id: "cat-starters", name: "Vorspeisen", sortOrder: 1 },
  });

  const mains = await prisma.category.upsert({
    where: { id: "cat-mains" },
    update: {},
    create: { id: "cat-mains", name: "Hauptgerichte", sortOrder: 2 },
  });

  const drinks = await prisma.category.upsert({
    where: { id: "cat-drinks" },
    update: {},
    create: { id: "cat-drinks", name: "Getränke", sortOrder: 3 },
  });

  const menuItems = [
    { name: "Bruschetta", description: "Tomaten, Knoblauch, Basilikum", price: 650, categoryId: starters.id, available: true },
    { name: "Caesar Salad", description: "Hähnchen, Parmesan, Croûtons", price: 950, categoryId: starters.id, available: true },
    { name: "Pasta Carbonara", description: "Speck, Ei, Parmesan", price: 1250, categoryId: mains.id, available: true },
    { name: "Pizza Margherita", description: "Tomate, Mozzarella, Basilikum", price: 1050, categoryId: mains.id, available: true },
    { name: "Rindersteak", description: "250g, Pommes, Gemüse", price: 2450, categoryId: mains.id, available: true },
    { name: "Wasser", price: 250, categoryId: drinks.id, available: true },
    { name: "Cola", price: 350, categoryId: drinks.id, available: true },
    { name: "Bier", price: 450, categoryId: drinks.id, available: true },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: `item-${item.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: { id: `item-${item.name.toLowerCase().replace(/\s+/g, "-")}`, ...item },
    });
  }

  console.log("Seeded database");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
