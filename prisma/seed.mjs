import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const guests = [
  { passId: "EP-2026-000148", name: "Chukwuemeka Obi", tier: "VIP Guest", table: "Table 07" },
  { passId: "EP-2026-000149", name: "Adaeze Nwosu", tier: "Family", table: "High Table" },
  { passId: "EP-2026-000150", name: "Tunde Bakare", tier: "Guest", table: "Table 12" },
  { passId: "EP-2026-000151", name: "Blessing Okoro", tier: "Guest", table: "Table 03" },
  { passId: "EP-2026-000152", name: "Ibrahim Musa", tier: "VIP Guest", table: "Table 01" },
];

for (const g of guests) {
  await prisma.guest.upsert({
    where: { passId: g.passId },
    update: {},
    create: g,
  });
}
console.log("Seeded", guests.length, "guests ✅");
await prisma.$disconnect();
