import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, mock } from "bun:test";
import { faktoryClient } from "../lib/jobs";
import { HttpCollector } from "./http-collector";

const prisma = new PrismaClient();
export const httpCollector = new HttpCollector();

type RequestCallback = (res: any) => void;

mock.module("http", () => {
  const http = require("http");
  return {
    ...http,
    request: (url: string | URL, options?: any, callback?: RequestCallback) => {
      const req = http.request(url, options, callback);

      req.on("finish", async () => {
        const urlObj = new URL(url.toString());
        httpCollector.capture({
          url: urlObj.toString(),
          path: urlObj.pathname,
          query: Object.fromEntries(urlObj.searchParams),
          method: options?.method || "GET",
          headers: options?.headers || {},
          body: options?.body || null,
        });
      });

      return req;
    },
  };
});

// Mock global fetch
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply: async (target, thisArg, [url, init]) => {
    const urlObj = new URL(url.toString());
    httpCollector.capture({
      url: urlObj.toString(),
      path: urlObj.pathname,
      query: Object.fromEntries(urlObj.searchParams),
      method: init?.method || "GET",
      headers: init?.headers || {},
      body: init?.body || null,
    });
    return target.apply(thisArg, [url, init]);
  },
});

beforeAll(async () => {
  // Any one-time setup
});

beforeEach(() => {
  httpCollector.clear();
});

beforeEach(() => faktoryClient.connect());
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
