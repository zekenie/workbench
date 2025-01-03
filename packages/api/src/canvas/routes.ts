import Elysia, { t } from "elysia";
import { authMiddleware } from "../auth/middleware";
import { offsetPaginationModel } from "../lib/pagination/offset.model";
import { countCanvases, createCanvas, listCanvases } from "./service";

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
