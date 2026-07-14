import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; pool?: Pool };
const pool = globalForPrisma.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL!,
  max: 5,
  allowExitOnIdle: true
});
const adapter = new PrismaPg(pool, { disposeExternalPool: true });
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
