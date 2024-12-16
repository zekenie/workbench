import Elysia, { t } from "elysia";
import { CompiledCode, getCompiledCode, getCompiledCodeDiff } from "./service";
import { authMiddleware } from "../auth/middleware";
import pubsub from "../pubsub";

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

export const compilerRoutes = new Elysia({
  prefix: "/compiler",
  tags: ["canvas", "compiler"],
})
  .use(authMiddleware)
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
  );
