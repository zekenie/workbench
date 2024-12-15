import Elysia, { t } from "elysia";
import { authMiddleware } from "../auth/middleware";
import {
  CompiledCode,
  countCanvases,
  createCanvas,
  getCompiledCode,
  getCompiledCodeDiff,
  listCanvases,
  updateSnapshot,
} from "./service";
import { prisma } from "../db";
import { offsetPaginationModel } from "../util/pagination/offset.model";
import pubsub from "../pubsub";

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

type CompiledEvents =
  | {
      type: "original";
      original: CompiledCode["latest"];
    }
  | {
      type: "changed";
      codeNames: string[];
      changed: CompiledCode["latest"];
    };

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
        snapshot: body.snapshot,
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
  .get(
    "/compiled",
    async function* compiled({
      query,
    }): AsyncGenerator<CompiledEvents, void, unknown> {
      let { latest } = await getCompiledCode({ id: query.id });
      yield {
        type: "original",
        original: latest,
      };
      for await (const message of pubsub.crossSubscribeIterator(
        "canvasId",
        query.id
      )) {
        if (message.event === "canvas.compile") {
          const {
            latest: newLatest,
            codeNames,
            changed,
          } = await getCompiledCodeDiff({
            original: latest,
            id: query.id,
          });

          latest = newLatest;

          yield {
            type: "changed",
            codeNames,
            changed,
          };
        }
      }
    },
    {
      auth: "api",
      query: t.Object({
        id: t.String(),
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
