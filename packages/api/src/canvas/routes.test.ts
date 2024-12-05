import { describe, expect, it, beforeEach } from "bun:test";
import { canvasRoutes } from "./routes";
import { treaty } from "@elysiajs/eden";
import { prisma } from "../db";
import { sign } from "../auth/jwt.service";
import { createCanvas } from "./service";
import { randomUUIDv7 } from "bun";

const apiClient = treaty(canvasRoutes);

async function worldSetup() {
  const user = await prisma.user.create({
    data: {
      email: `${Math.random()}@foo.com`,
    },
  });

  const jwt = await sign(user.id);
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
  beforeEach(async () => {});

  describe("POST /snapshot", () => {
    it("rejects unauthenticated requests", async () => {
      const { status } = await apiClient.canvases.snapshot.post({
        id: randomUUIDv7(),
        snapshot: {},
      });
      expect(status).toBe(401);
    });

    it("rejects user authenticated requests requests", async () => {
      const { jwt } = await worldSetup();
      const { status } = await apiClient.canvases.snapshot.post(
        {
          id: randomUUIDv7(),
          snapshot: {},
        },
        {
          ...configureAuthenticatedRequest({ jwt }),
        }
      );
      expect(status).toBe(401);
    });

    it("accepts api authenticated requests and updates the canvas", async () => {
      const { user } = await worldSetup();
      const id = await createCanvas({ userId: user.id, title: "foobar" });

      const apiToken = await prisma.apiToken.create({
        data: {
          tokenHash: await Bun.password.hash("foo"),
        },
      });

      const { status } = await apiClient.canvases.snapshot.post(
        {
          id,
          snapshot: { foobar: "baz" },
        },
        {
          headers: {
            "x-api-secret": "foo",
            "x-api-id": apiToken.id,
          },
        }
      );

      expect(status).toBe(200);
      const canvas = await prisma.canvas.findFirstOrThrow({ where: { id } });
      expect(canvas.content).toMatchObject({
        foobar: "baz",
      });
    });
  });

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
        { ...configureAuthenticatedRequest({ jwt }) }
      );
      expect(data).toMatchObject({
        id: expect.any(String),
      });
    });

    it("gives you canvas access", async () => {
      const { jwt, user } = await worldSetup();
      const { data } = await apiClient.canvases.create.post(
        {},
        { ...configureAuthenticatedRequest({ jwt }) }
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
