import { describe, expect, it, beforeEach } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { prisma } from "../db";
import { sign } from "../auth/jwt.service";
import { snapshot } from "../canvas/fixtures/snapshot";
import { startWorker } from "../worker.process";
import { app } from "../index.process";

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

describe("compiler routes", () => {
  describe("GET /compiled", () => {
    it("emits an empty array for a blank canvas", async () => {
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
      const { data: streamData } = await apiClient.compiler.compiled.get({
        fetch: {
          signal: abortController.signal,
        },
        query: { id: canvasId! },
        headers: {
          "x-api-secret": "foo",
          "x-api-id": apiToken.id,
        },
      });

      for await (const chunk of streamData!) {
        if (chunk.type === "original") {
          expect(chunk.original).toEqual([]);
          expect(chunk.type).toEqual("original");
          abortController.abort();
          break;
        }
      }
    });

    it("emits a `changed` event when the canvas has changed", async () => {
      const { jwt } = await worldSetup();
      const worker = await startWorker();

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
      const { data: streamData } = await apiClient.compiler.compiled.get({
        fetch: {
          signal: abortController.signal,
        },
        query: { id: canvasId! },
        headers: {
          "x-api-secret": "foo",
          "x-api-id": apiToken.id,
        },
      });

      await apiClient.snapshots.snapshot.post(
        {
          snapshot: snapshot as any,
          id: canvasId!,
        },
        {
          headers: {
            "x-api-secret": "foo",
            "x-api-id": apiToken.id,
          },
        }
      );

      for await (const chunk of streamData!) {
        if (chunk.type === "original") {
          continue;
        }

        expect(chunk.codeNames).toEqual(["birthdate", "now", "age"]);
        expect(chunk.type).toEqual("changed");
        expect(chunk.changed).toHaveLength(3);
        break;
      }

      abortController.abort();
      await worker.stop();
    });
  });
});
