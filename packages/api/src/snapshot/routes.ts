import Elysia, { t } from "elysia";
import { Delta } from "jsondiffpatch";
import { last } from "lodash-es";
import { authMiddleware } from "../auth/middleware";
import { prisma } from "../db";
import pubsub, { bulkPublish } from "../lib/pubsub";
import { updateSnapshot } from "./service";
import { EventEmitter, on } from "node:events";
import { createTicker } from "../lib/ticker";

const ticker = createTicker(1000);

type PatchEvents =
  | {
      type: "digest";
      digest: string;
    }
  | {
      type: "patch";
      patch: Delta;
    }
  | {
      type: "tick";
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
          yield { type: "patch", patch: snapshot.patches as Delta };
          if (snapshot === last(snapshotRecords)) {
            yield { type: "digest", digest: snapshot.digest };
          }
        }

        currentClock = last(snapshotRecords)!.clock;
      }

      const emitter = new EventEmitter();

      // heartbeat
      ticker.on("tick", () => {
        emitter.emit("message", { type: "tick" });
      });

      await pubsub.crossSubscribe("canvasId", query.id, async (message) => {
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
            return;
          }

          emitter.emit("message", {
            type: "patch",
            patch: snap.patches as Delta,
          });
          emitter.emit("message", { type: "digest", digest: snap.digest });
        }
      });

      for await (const messages of on(emitter, "message")) {
        for (const message of messages) {
          yield message as unknown as PatchEvents;
        }
      }
      // const iterator = pubsub.crossSubscribeIterator("canvasId", query.id);

      // now subscribe to realtime changes
      // for await (const message of iterator) {
      // }
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
    },
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
    },
  )
  .post(
    "/snapshot",
    async ({ body }) => {
      const { canvasId, clock, digest, changedNodes } = await updateSnapshot({
        id: body.id,
        snapshot: body.snapshot as any,
      });

      await bulkPublish([
        {
          event: "canvas.snapshot",
          canvasId,
          clock,
          digest,
        },
        ...changedNodes.map((change) => ({
          event: "canvas.node.change",
          canvasId,
          nodeId: change.id,
        })),
      ]);
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
    },
  );
