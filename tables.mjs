/**
 * Find - and optionally repair - duplicate table names.
 *
 *   node tables.mjs evp              show the tables and any clashes
 *   node tables.mjs evp --fix        rename the clashing ones to free numbers
 *
 * Guests are matched to a table by its NAME, so two tables sharing one
 * name are indistinguishable to the system: both show the same guests,
 * and renaming either one drags the other's guests with it.
 *
 * The repair renames the EMPTIER of the two to the next free number and
 * leaves the one holding guests untouched, so nobody loses their seat.
 */
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const want = (process.argv[2] || "").trim();
const FIX = process.argv.includes("--fix");

const event = want
  ? await p.event.findFirst({ where: { slug: { contains: want }, deletedAt: null }, orderBy: { createdAt: "desc" } })
  : await p.event.findFirst({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });

if (!event) {
  console.log("\n  No event found" + (want ? ` matching "${want}"` : "") + ".\n");
  process.exit(1);
}

const tables = await p.seatTable.findMany({
  where: { eventId: event.id },
  orderBy: [{ section: "asc" }, { position: "asc" }],
});

const guests = await p.guest.findMany({
  where: { eventId: event.id, deletedAt: null, isVendor: false },
  select: { id: true, name: true, table: true, section: true },
});

const seatedAt = (n) => guests.filter((g) => g.table === n);

console.log("");
console.log("  " + event.title);
console.log("  tables: " + tables.length + "   guests: " + guests.length);
console.log("");

/* group by name */
const byName = {};
for (const t of tables) (byName[t.name] ||= []).push(t);
const clashes = Object.entries(byName).filter(([, list]) => list.length > 1);

console.log("  Tables");
for (const t of tables) {
  const n = seatedAt(t.name).length;
  const dup = byName[t.name].length > 1 ? "   <-- DUPLICATE NAME" : "";
  console.log("    " + String(t.name).padEnd(18) + " section=" + String(t.section).padEnd(14) + " cap=" + String(t.capacity).padStart(3) + "  guests=" + String(n).padStart(3) + dup);
}
console.log("");

/* guests pointing at a table that does not exist */
const names = new Set(tables.map((t) => t.name));
const orphans = guests.filter((g) => g.table && g.table !== "TBA" && !names.has(g.table));
if (orphans.length) {
  console.log("  Guests sitting at a table that no longer exists:");
  const byTable = {};
  for (const g of orphans) (byTable[g.table] ||= []).push(g.name);
  for (const [t, list] of Object.entries(byTable)) {
    console.log("    \"" + t + "\"  ->  " + list.length + " guest(s): " + list.slice(0, 6).join(", ") + (list.length > 6 ? " ..." : ""));
  }
  console.log("");
}

if (!clashes.length) {
  console.log("  No duplicate table names.");
  console.log("");
  await p.$disconnect();
  process.exit(0);
}

console.log("  " + clashes.length + " duplicated name(s):");
for (const [name, list] of clashes) {
  console.log("    \"" + name + "\" is used by " + list.length + " tables, holding " + seatedAt(name).length + " guest(s) between them");
}
console.log("");

if (!FIX) {
  console.log("  Run again with --fix to rename the emptier duplicates to free numbers.");
  console.log("  Nothing has been changed.");
  console.log("");
  await p.$disconnect();
  process.exit(0);
}

/* work out the next free "<prefix> <n>" name */
const taken = new Set(tables.map((t) => t.name));
function freeName(prefix) {
  let max = 0;
  for (const t of tables) {
    const m = String(t.name).match(/^(.*?)\s+(\d+)$/);
    if (m && m[1].toLowerCase() === prefix.toLowerCase()) max = Math.max(max, Number(m[2]));
  }
  let n = max + 1;
  while (taken.has(prefix + " " + n)) n++;
  const out = prefix + " " + n;
  taken.add(out);
  return out;
}

let changed = 0;
for (const [name, list] of clashes) {
  /* keep whichever already holds guests; if none do, keep the first */
  const withGuests = list.filter((t) => seatedAt(t.name).length > 0);
  const keep = withGuests.length ? withGuests[0] : list[0];
  const prefix = String(name).match(/^(.*?)\s+\d+$/)?.[1] || "Table";

  for (const t of list) {
    if (t.id === keep.id) continue;
    const next = freeName(prefix);
    await p.seatTable.update({ where: { id: t.id }, data: { name: next } });
    console.log("    renamed a duplicate \"" + name + "\" (" + t.section + ") -> \"" + next + "\"");
    changed++;
  }
}

console.log("");
console.log("  " + changed + " table(s) renamed. No guest was moved.");
console.log("");

await p.$disconnect();
