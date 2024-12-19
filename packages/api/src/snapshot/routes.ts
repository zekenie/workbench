import Elysia, { t } from "elysia";
import { Operation } from "fast-json-patch";
import { last } from "lodash-es";
import { authMiddleware } from "../auth/middleware";
import { prisma } from "../db";
import { faktoryClient } from "../jobs";
import pubsub from "../pubsub";
import { updateSnapshot } from "./service";

type PatchEvents =
  | {
      type: "digest";
      digest: string;
    }
  | {
      type: "patch";
      patch: Operation;
    };

export const snapshotRoutes = new Elysia({
  prefix: "/snapshots",
  tags: ["canvas"],
})
  .use(authMiddleware)

  /**
   * Produces a stream of JSON Patch operations for a canvas
   * as users edit it
   */
  .get(
    "/snapshot-stream",
    async function* ({
      query,
      error,
    }): AsyncGenerator<PatchEvents, any, unknown> {
      let currentClock = query.clock;
      const getLatestClock = async () => {
        const snap = await prisma.snapshot.findFirst({
          where: {
            canvasId: query.id,
          },
          select: { clock: true },
          orderBy: { clock: "desc" },
        });

        if (snap) {
          return snap.clock;
        }
        return 0;
      };

      if (currentClock > (await getLatestClock())) {
        return error(400, "clock too high");
      }

      // this loop "catches up" the client from the clock they gave to the current latest clock,
      // even if the current latest changes while we're streaming
      while (currentClock < (await getLatestClock())) {
        const snapshotRecords = await prisma.snapshot.findMany({
          take: 500,
          where: {
            canvasId: query.id,
            clock: { gt: currentClock },
          },
          orderBy: { clock: "asc" },
        });

        for (const snapshot of snapshotRecords) {
          for (const op of snapshot.patches as unknown as Operation[]) {
            yield { type: "patch", patch: op };
          }
          if (snapshot === last(snapshotRecords)) {
            yield { type: "digest", digest: snapshot.digest };
          }
        }

        currentClock = last(snapshotRecords)!.clock;
      }

      const iterator = pubsub.crossSubscribeIterator("canvasId", query.id);

      // now subscribe to realtime changes
      for await (const message of iterator) {
        if (message.event === "canvas.snapshot") {
          const snap = await prisma.snapshot.findFirst({
            where: {
              canvasId: query.id,
              clock: message.clock,
            },
          });

          if (!snap) {
            console.warn("got message about snap but it was not found", {
              canvasId: query.id,
              clock: message.clock,
            });
            continue;
          }

          for (const op of snap.patches as unknown as Operation[]) {
            yield { type: "patch", patch: op };
          }
          yield { type: "digest", digest: snap.digest };
        }
      }
    },
    {
      auth: "api",
      query: t.Object({
        id: t.String(),
        clock: t
          .Transform(t.String())
          .Decode((value) => parseInt(value))
          .Encode((value) => value.toString()),
      }),
    }
  )
  .get(
    "/snapshot",
    async ({ query }) => {
      const canvas = await prisma.canvas.findFirst({
        where: {
          id: query.id,
        },
      });

      return {
        snapshot: canvas?.currentSnapshot,
      };
    },
    {
      auth: "api",
      query: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    "/snapshot",
    async ({ body }) => {
      console.log("new snap");
      const { canvasId, clock, digest } = await updateSnapshot({
        id: body.id,
        snapshot: body.snapshot as any,
      });

      console.log("new snap", { canvasId, clock, digest });

      await faktoryClient.job("canvas.compile", { id: body.id }).push();
      await pubsub.publish({
        event: "canvas.snapshot",
        canvasId,
        clock,
        digest,
      });
    },
    {
      auth: "api",
      body: t.Object({
        id: t.String(),
        snapshot: t.Intersect([
          t.Record(t.String(), t.Unknown()),
          t.Object({
            clock: t.Number(),
          }),
        ]),
      }),
    }
  );
