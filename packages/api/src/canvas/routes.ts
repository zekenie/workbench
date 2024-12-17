import Elysia, { t } from "elysia";
import { authMiddleware } from "../auth/middleware";
import { prisma } from "../db";
import { offsetPaginationModel } from "../util/pagination/offset.model";
import {
  countCanvases,
  createCanvas,
  hashString,
  listCanvases,
  updateSnapshot,
} from "./service";
import pubsub from "../pubsub";
import { faktoryClient } from "../jobs";
import { snapshot } from "./fixtures/snapshot";

const canvasPagination = offsetPaginationModel(
  t.Object({
    id: t.String({
      format: "uuid",
    }),
    title: t.Union([t.String(), t.Null()]),
    titleGenerated: t.Union([t.String(), t.Null()]),
    description: t.Union([t.String(), t.Null()]),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  }),
  {}
);

export const canvasRoutes = new Elysia({
  prefix: "/canvases",
  tags: ["canvas"],
})
  .use(authMiddleware)
  .use(canvasPagination)
  .get(
    "/list",
    async ({ principal, query }) => {
      const [records, total] = await Promise.all([
        listCanvases({ onBehalfOf: principal!.id, ...query }),
        countCanvases({ onBehalfOf: principal!.id }),
      ]);
      return {
        records,
        total,
      };
    },
    {
      auth: "user",
      query: "paginationQuery",
      response: "paginationResponse",
    }
  )
  .get(
    "/snapshot",
    async ({ query }) => {
      const snapshot = await prisma.snapshot.findFirst({
        where: {
          canvasId: query.id,
        },
        orderBy: { clock: "desc" },
      });

      return {
        snapshot: snapshot?.content,
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
      await updateSnapshot({
        id: body.id,
        snapshot: body.snapshot as any,
      });

      await faktoryClient.job("canvas.compile", { id: body.id }).push();
      await pubsub.publish({
        event: "canvas.snapshot",
        canvasId: body.id,
        clock: body.snapshot.clock,
        digest: hashString(JSON.stringify(snapshot)),
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
  )

  .post(
    "/create",
    async ({ principal }) => {
      const id = await createCanvas({ userId: principal!.id });
      return { id };
    },
    {
      auth: "user",
      body: t.Optional(
        t.Object({
          title: t.Optional(t.String()),
          description: t.Optional(t.String()),
        })
      ),
      response: t.Object({
        id: t.String({ format: "uuid" }),
      }),
    }
  );
