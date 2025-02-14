import { treaty } from "@elysiajs/eden";
import { describe, expect, it } from "bun:test";
import { sign } from "../auth/jwt.service";
import { prisma } from "../db";
import { canvasRoutes } from "./routes";
import { createCanvas } from "./service";
import { randomUUIDv7 } from "bun";

const apiClient = treaty(canvasRoutes);

async function worldSetup() {
  const userId = randomUUIDv7();
  const [user, jwt] = await Promise.all([
    prisma.user.create({
      data: {
        id: userId,
        email: `${Math.random()}@foo.com`,
      },
    }),
    sign(userId),
  ]);

  return { jwt, user };
}

const configureAuthenticatedRequest = ({ jwt }: { jwt: string }) => {
  return {
    headers: {
      authorization: `Bearer ${jwt}`,
    },
  };
};

describe("canvases", () => {
  describe("GET /", () => {
    it("rejects unauthenticated requests", async () => {
      const { status } = await apiClient.canvases.list.get({
        query: {
          skip: 0,
          take: 10,
        },
      });
      expect(status).toBe(401);
    });

    it("lists no records belonging to you when there aren't any ", async () => {
      const { jwt } = await worldSetup();
      const { data } = await apiClient.canvases.list.get({
        query: {
          skip: 0,
          take: 10,
        },
        ...configureAuthenticatedRequest({ jwt }),
      });

      expect(data).toEqual({
        records: [],
        total: 0,
      });
    });

    it("lists records belonging to you when they exist ", async () => {
      const { jwt, user } = await worldSetup();
      await createCanvas({ userId: user.id, title: "foobar" });
      const { data } = await apiClient.canvases.list.get({
        query: {
          skip: 0,
          take: 10,
        },
        ...configureAuthenticatedRequest({ jwt }),
      });

      expect(data?.records).toMatchObject([
        { id: expect.any(String), title: "foobar" },
      ]);
    });

    it("does not include records that do not belong to you", async () => {
      const { jwt } = await worldSetup();
      const anotherUser = await prisma.user.create({
        data: { email: "bar@baz.com" },
      });

      await createCanvas({ userId: anotherUser.id, title: "foobar" });

      const { data } = await apiClient.canvases.list.get({
        query: {
          skip: 0,
          take: 10,
        },
        ...configureAuthenticatedRequest({ jwt }),
      });

      expect(data?.records).toEqual([]);
    });
  });

  describe("POST /create", () => {
    it("creates a canvas", async () => {
      const { jwt } = await worldSetup();
      const { data } = await apiClient.canvases.create.post(
        {
          title: "a canvas!",
          description: "it is what it is",
        },
        { ...configureAuthenticatedRequest({ jwt }) },
      );
      expect(data).toMatchObject({
        id: expect.any(String),
      });
    });

    it("gives you canvas access", async () => {
      const { jwt, user } = await worldSetup();
      const { data } = await apiClient.canvases.create.post(
        {},
        { ...configureAuthenticatedRequest({ jwt }) },
      );

      const accessRecords = await prisma.canvasAccess.findMany();

      expect(accessRecords).toMatchObject([
        { userId: user.id, canvasId: data?.id },
      ]);
    });

    it("rejects unauthenticated requests", async () => {
      const { status } = await apiClient.canvases.create.post({});

      expect(status).toBe(401);
    });
  });
});
