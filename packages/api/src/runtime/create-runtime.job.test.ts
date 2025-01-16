import { randomUUIDv7 } from "bun";
import { beforeAll, describe, expect, it } from "bun:test";
import { createCanvas } from "../canvas/service";
import { prisma } from "../db";
import { RequestQuery } from "../test/http-collector";
import { httpCollector } from "../test/setup";
import { slugifyIdentifier } from "./create-machine-helpers";
import { faktoryClient } from "../lib/jobs";
import { waitFor } from "../test/wait-for";
import * as worker from "../worker.process";

async function worldSetup() {
  await prisma.canvasEnvironment.deleteMany();
  const userId = randomUUIDv7();
  const [user] = await Promise.all([
    prisma.user.create({
      data: {
        id: userId,
        email: `${Math.random()}@foo.com`,
      },
    }),
  ]);

  const canvasId = await createCanvas({ userId });
  await prisma.canvasEnvironment.deleteMany();
  // await enqueueAndComplete("runtime.create", { id: canvasId });
  await faktoryClient.job("runtime.create", { id: canvasId }).push();
  return { user, canvasId };
}

/**
 * Warning: these tests are a little flaky due to something
 * weird about faktory... let's see where this goes. disable for
 * now if annoying
 */

describe("Create Runtime Job", () => {
  beforeAll(async () => {
    await worker.startProcess();
  });
  it("creates a canvas environment record", async () => {
    const { canvasId } = await worldSetup();

    await waitFor(async () => {
      return (await prisma.canvasEnvironment.count()) === 1;
    });

    const env = await prisma.canvasEnvironment.findFirst({
      where: {
        canvasId,
      },
    });

    expect(env).toBeObject();
  });

  it("hits fly endpoints", async () => {
    const { canvasId } = await worldSetup();

    await waitFor(async () => {
      return (await prisma.canvasEnvironment.count()) === 1;
    });

    const appSlug = slugifyIdentifier({
      canvasId,
      envType: "default",
    });

    const flyRequests = [
      httpCollector.getRequest(
        new RequestQuery().to(Bun.env.FLY_API_URL).path(`/apps`).method("POST")
      ),
      httpCollector.getRequest(
        new RequestQuery()
          .to(Bun.env.FLY_API_URL)
          .path(`/apps/${appSlug}/volumes`)
          .method("POST")
      ),
      httpCollector.getRequest(
        new RequestQuery()
          .to(Bun.env.FLY_API_URL)
          .path(`/apps/${appSlug}/machines`)
          .method("POST")
      ),
    ];

    for (const flyReq of flyRequests) {
      expect(flyReq).toBeObject();
    }
  });
});
