import { PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, afterAll } from "bun:test";

const prisma = new PrismaClient();

beforeAll(async () => {
  // Any one-time setup
});

beforeEach(async () => {
  try {
    // Get all tables
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `;

    await prisma.$executeRawUnsafe(`SET session_replication_role = 'replica';`);

    // Using Prisma's raw interpolation for each table
    for (const { tablename } of tables) {
      if (!tablename.startsWith("_")) {
        // Using Prisma.sql for proper escaping

        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${tablename}" CASCADE;`
        );
      }
    }

    await prisma.$executeRawUnsafe(`SET session_replication_role = 'origin';`);
  } catch (error) {
    console.error("Error cleaning database:", error);
    throw error;
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Export prisma client for use in tests
export { prisma };
