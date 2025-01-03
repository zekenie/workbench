import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { runtimeRoutes } from "./routes";
import { prisma } from "../db";
import { sign } from "../auth/jwt.service";
import { createCanvas } from "../canvas/service";
import { randomUUIDv7 } from "bun";
import { httpCollector } from "../test/setup";
import { RequestQuery } from "../test/http-collector";

const apiClient = treaty(runtimeRoutes);

async function worldSetup() {
  const userId = randomUUIDv7();

  const [user, jwt, canvasId] = await Promise.all([
    prisma.user.create({
      data: {
        id: userId,
        email: `${Math.random()}@foo.com`,
      },
    }),
    sign(userId),
    createCanvas({ userId }),
  ]);

  await prisma.canvasEnvironment.create({
    data: {
      appId: randomUUIDv7(),
      machineId: randomUUIDv7(),
      volumeId: randomUUIDv7(),
      type: "default",
      canvasId: canvasId,
      region: "ord",
    },
  });

  return { jwt, user, canvasId };
}

const configureAuthenticatedRequest = ({ jwt }: { jwt: string }) => {
  return {
    headers: {
      authorization: `Bearer ${jwt}`,
    },
  };
};

describe("/machines", () => {
  describe("/:id", () => {
    (["start", "stop", "suspend"] as const).forEach((verb) => {
      describe(`POST /${verb}`, () => {
        it("rejects unauthenticated requests", async () => {
          const { status } = await apiClient
            .runtime({ id: "foo" })
            [verb].post();
          expect(status).toBe(401);
        });

        it("rejects requests from known users without access to canvas", async () => {
          const { jwt } = await worldSetup();
          await prisma.canvasAccess.deleteMany();

          const { status } = await apiClient.runtime({ id: "foo" })[verb].post({
            ...configureAuthenticatedRequest({ jwt }),
          });
          expect(status).toBe(401);
        });

        it("makes the proper fly api call", async () => {
          const { jwt, canvasId } = await worldSetup();
          const env = await prisma.canvasEnvironment.findFirstOrThrow({
            where: { canvasId: canvasId },
          });

          await apiClient.runtime({ id: canvasId })[verb].post(
            {},
            {
              ...configureAuthenticatedRequest({ jwt }),
            }
          );

          const outgoingRequest = httpCollector.getRequest(
            new RequestQuery()
              .to(Bun.env.FLY_API_URL)
              .path(`/apps/${env.appId}/machines/${env.machineId}/${verb}`)
              .method("POST")
          );

          expect(outgoingRequest).toBeObject();
        });
      });
    });
  });
});
