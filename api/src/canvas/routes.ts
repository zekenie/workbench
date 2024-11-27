import Elysia, { t } from "elysia";
import { authMiddleware } from "../auth/middleware";
import { createCanvas, listCanvases, findMyCanvas } from "./service";
import { prisma } from "../db";

export const canvasRoutes = new Elysia({
  prefix: "/canvases",
  tags: ["canvas"],
})
  .use(authMiddleware)
  .get(
    "/",
    async ({ principal }) => {
      return listCanvases({ onBehalfOf: principal.id });
    },
    {
      auth: "user",
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
        snapshot: t.Any({
          description: "TL Draw state snapshot",
        }),
        id: t.String({ format: "uuid" }),
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
