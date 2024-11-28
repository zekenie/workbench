import Elysia, { t } from "elysia";
import { authMiddleware } from "../auth/middleware";
import { countCanvases, createCanvas, listCanvases } from "./service";
import { prisma } from "../db";
import { offsetPaginationModel } from "../util/pagination/offset.model";

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
    "/",
    async ({ principal, query }) => {
      const [records, total] = await Promise.all([
        listCanvases({ onBehalfOf: principal.id, ...query }),
        countCanvases({ onBehalfOf: principal.id }),
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
      const canvas = await prisma.canvas.findFirstOrThrow({
        where: {
          id: query.id,
        },
      });

      return {
        snapshot: canvas.content,
      };
    },
    {
      query: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    "/snapshot",
    async ({ body }) => {
      const canvas = await prisma.canvas.findFirstOrThrow({
        where: {
          id: body.id,
        },
      });

      await prisma.canvas.update({
        data: {
          content: body.snapshot,
        },
        where: {
          id: canvas.id,
        },
      });
    },
    {
      auth: "api",
      body: t.Object({
        id: t.String(),
        snapshot: t.Any({
          description: "TL Draw state snapshot",
        }),
      }),
    }
  )
  .post(
    "/create",
    async ({ principal }) => {
      const id = await createCanvas({ userId: principal.id });
      return { id };
    },
    {
      auth: "user",
      body: t.Object({
        title: t.Optional(t.String()),
        description: t.Optional(t.String()),
      }),
      response: t.Object({
        id: t.String({ format: "uuid" }),
      }),
    }
  );
