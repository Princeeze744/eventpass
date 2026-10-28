/**
 * Which guests are crew, and how were they recorded?
 *
 *   node vendorcheck.mjs                 (most recent event)
 *   node vendorcheck.mjs the-rising-gem  (slug, or part of one)
 *
 * There are two separate ideas in the data and only one of them is a
 * real vendor record:
 *
 *   isVendor = true   created on the Vendors page - crew
 *   tier = "Vendor"   an ordinary guest whose category was set to
 *                     Vendor in the Edit Guest box
 *
 * Every filter written so far honours the first. If your five vendors
 * are the second kind, they count as guests everywhere.
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const want = (process.argv[2] || "").trim();

const event = want
  ? await p.event.findFirst({ where: { slug: { contains: want }, deletedAt: null }, orderBy: { createdAt: "desc" } })
  : await p.event.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });

if (!event) {
  console.log("\n  No event found" + (want ? ` matching "${want}"` : "") + ".\n");
  process.exit(1);
}

const all = await p.guest.findMany({
  where: { eventId: event.id, deletedAt: null },
  select: { name: true, tier: true, isVendor: true, status: true, table: true },
  orderBy: { name: "asc" },
});

const realVendors = all.filter((g) => g.isVendor);
const labelled = all.filter((g) => !g.isVendor && g.tier === "Vendor");
const guests = all.filter((g) => !g.isVendor && g.tier !== "Vendor");

console.log("");
console.log("  " + event.title);
console.log("  " + event.slug);
console.log("");
console.log("  total rows (not deleted)        : " + all.length);
console.log("  real vendors  (isVendor = true) : " + realVendors.length);
console.log("  labelled only (tier = Vendor)   : " + labelled.length + "   <-- these count as guests");
console.log("  actual guests                   : " + guests.length);
console.log("");

if (realVendors.length) {
  console.log("  Vendors page records:");
  for (const g of realVendors) console.log("    " + g.name + "  [" + g.tier + "]  table=" + g.table);
  console.log("");
}

if (labelled.length) {
  console.log("  Guests merely labelled Vendor:");
  for (const g of labelled) console.log("    " + g.name + "  status=" + g.status + "  table=" + g.table);
  console.log("");
}

await p.$disconnect();
