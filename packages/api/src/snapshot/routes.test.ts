import { treaty } from "@elysiajs/eden";
import { randomUUIDv7 } from "bun";
import { beforeEach, describe, expect, it } from "bun:test";
import { sign } from "../auth/jwt.service";
import { prisma } from "../db";
import { app } from "../index";
import { createCanvas } from "../canvas/service";

const apiClient = treaty(app);

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

describe("snapshots", () => {
  beforeEach(async () => {});

  describe("POST /snapshot", () => {
    it("rejects unauthenticated requests", async () => {
      const { status } = await apiClient.snapshots.snapshot.post({
        id: randomUUIDv7(),
        snapshot: { clock: 1 },
      });
      expect(status).toBe(401);
    });

    it("rejects user authenticated requests requests", async () => {
      const { jwt } = await worldSetup();
      const { status } = await apiClient.snapshots.snapshot.post(
        {
          id: randomUUIDv7(),
          snapshot: { clock: 1 },
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

      const { status } = await apiClient.snapshots.snapshot.post(
        {
          id,
          snapshot: { foobar: "baz", clock: 1 },
        },
        {
          headers: {
            "x-api-secret": "foo",
            "x-api-id": apiToken.id,
          },
        }
      );

      expect(status).toBe(200);
      const { currentSnapshot } = await prisma.canvas.findFirstOrThrow({
        where: { id: id },
      });
      expect(currentSnapshot).toMatchObject({
        foobar: "baz",
      });
    });
  });

  describe("GET /snapshot-stream", () => {
    it("rejects unauthenticated requests", async () => {
      const { status, response, error } = await apiClient.snapshots[
        "snapshot-stream"
      ].get({
        query: {
          id: randomUUIDv7(),
          clock: 1,
        },
      });
      expect(status).toBe(401);
    });

    it("rejects user authenticated requests requests", async () => {
      const { jwt } = await worldSetup();
      const { status } = await apiClient.snapshots["snapshot-stream"].get({
        query: {
          clock: 1,
          id: randomUUIDv7(),
        },
        ...configureAuthenticatedRequest({ jwt }),
      });
      expect(status).toBe(401);
    });

    it("plays catch up with events that have already happened", async () => {
      const { jwt } = await worldSetup();
      const apiToken = await prisma.apiToken.create({
        data: {
          tokenHash: await Bun.password.hash("foo"),
        },
      });

      const { data } = await apiClient.canvases.create.post(
        {},
        { ...configureAuthenticatedRequest({ jwt }) }
      );

      const canvasId = data?.id;

      // insert some initial data
      for (const num of [1, 2, 3]) {
        await apiClient.snapshots.snapshot.post(
          {
            snapshot: {
              clock: num,
              other: num,
            },
            id: canvasId!,
          },
          {
            headers: {
              "x-api-secret": "foo",
              "x-api-id": apiToken.id,
            },
          }
        );
      }

      const abortController = new AbortController();
      const { data: streamData } = await apiClient.snapshots[
        "snapshot-stream"
      ].get({
        fetch: {
          signal: abortController.signal,
        },
        query: { id: canvasId!, clock: 0 },
        headers: {
          "x-api-secret": "foo",
          "x-api-id": apiToken.id,
        },
      });

      if (!streamData || !("next" in streamData)) {
        throw new Error("no stream");
      }
      const patches = await collectNPatches(streamData, 9);

      expect(patches).toEqual([
        { type: "patch", patch: { op: "add", path: "/clock", value: 1 } },
        { type: "patch", patch: { op: "add", path: "/other", value: 1 } },
        { type: "digest", digest: expect.any(String) },
        { type: "patch", patch: { op: "replace", path: "/other", value: 2 } },
        { type: "patch", patch: { op: "replace", path: "/clock", value: 2 } },
        { type: "digest", digest: expect.any(String) },
        { type: "patch", patch: { op: "replace", path: "/other", value: 3 } },
        { type: "patch", patch: { op: "replace", path: "/clock", value: 3 } },
        { type: "digest", digest: expect.any(String) },
      ]);
    });

    it("does not replay patches if the clock is already past them", async () => {
      const { jwt } = await worldSetup();
      const apiToken = await prisma.apiToken.create({
        data: {
          tokenHash: await Bun.password.hash("foo"),
        },
      });

      const { data } = await apiClient.canvases.create.post(
        {},
        { ...configureAuthenticatedRequest({ jwt }) }
      );

      const canvasId = data?.id;

      // insert some initial data
      for (const num of [1, 2, 3]) {
        await apiClient.snapshots.snapshot.post(
          {
            snapshot: {
              clock: num,
              other: num,
            },
            id: canvasId!,
          },
          {
            headers: {
              "x-api-secret": "foo",
              "x-api-id": apiToken.id,
            },
          }
        );
      }

      const abortController = new AbortController();
      const { data: streamData } = await apiClient.snapshots[
        "snapshot-stream"
      ].get({
        fetch: {
          signal: abortController.signal,
        },
        query: { id: canvasId!, clock: 2 },
        headers: {
          "x-api-secret": "foo",
          "x-api-id": apiToken.id,
        },
      });

      if (!streamData || !("next" in streamData)) {
        throw new Error("no stream");
      }
      const patches = await collectNPatches(streamData, 3);

      expect(patches).toEqual([
        { type: "patch", patch: { op: "replace", path: "/other", value: 3 } },
        { type: "patch", patch: { op: "replace", path: "/clock", value: 3 } },
        { type: "digest", digest: expect.any(String) },
      ]);
    });
    it("streams patches as they happen", async () => {
      const { jwt } = await worldSetup();
      const apiToken = await prisma.apiToken.create({
        data: {
          tokenHash: await Bun.password.hash("foo"),
        },
      });

      const { data } = await apiClient.canvases.create.post(
        {},
        { ...configureAuthenticatedRequest({ jwt }) }
      );

      const canvasId = data?.id;

      const abortController = new AbortController();
      const streamPromise = apiClient.snapshots["snapshot-stream"].get({
        fetch: {
          signal: abortController.signal,
        },
        query: { id: canvasId!, clock: 0 },
        headers: {
          "x-api-secret": "foo",
          "x-api-id": apiToken.id,
        },
      });

      // insert some data _after_ the stream is established
      const { status } = await apiClient.snapshots.snapshot.post(
        {
          snapshot: {
            clock: 1,
            other: 1,
          },
          id: canvasId!,
        },
        {
          headers: {
            "x-api-secret": "foo",
            "x-api-id": apiToken.id,
          },
        }
      );

      expect(status).toBe(200);

      const { data: streamData } = await streamPromise;

      if (!streamData || !("next" in streamData)) {
        throw new Error("no stream");
      }

      const patches = await collectNPatches(streamData, 3);

      expect(patches).toEqual([
        { type: "patch", patch: { op: "add", path: "/clock", value: 1 } },
        { type: "patch", patch: { op: "add", path: "/other", value: 1 } },
        { type: "digest", digest: expect.any(String) },
      ]);
    });
  });
});

async function collectNPatches<T>(stream: AsyncIterable<T>, n: number) {
  const patches = [];
  for await (const patch of stream) {
    patches.push(patch);
    if (patches.length === n) break;
  }
  return patches;
}
