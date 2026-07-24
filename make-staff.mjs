import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const email = process.argv[2];
if (!email) { console.log("Usage: node make-staff.mjs your@email.com"); process.exit(1); }
const u = await prisma.user.update({ where: { email: email.toLowerCase() }, data: { isStaff: true } });
console.log("Staff access granted to", u.email);
await prisma.$disconnect();
