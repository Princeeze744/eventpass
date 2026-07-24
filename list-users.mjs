import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const users = await prisma.user.findMany({ select: { email: true, name: true, role: true, isStaff: true } });
console.table(users);
await prisma.$disconnect();
