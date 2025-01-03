import Elysia, { error, t } from "elysia";
import { authMiddleware } from "../auth/middleware";
import { RuntimeMachine } from "./runtime-machine";
import { hasAccess } from "../canvas/service";

export const runtimeRoutes = new Elysia({
  prefix: "/runtime",
  tags: ["runtime"],
})
  .use(authMiddleware)
  .group("/:id", (app) => {
    return app
      .guard({
        beforeHandle: async ({ params: { id }, principal }) => {
          if (!principal) {
            return error(401);
          }
          const letThrough = await hasAccess({
            userId: principal.id,
            canvasId: id,
          });

          if (!letThrough) {
            return error(401);
          }
        },
      })
      .derive(({ params }) => {
        return {
          machine: new RuntimeMachine({
            canvasId: params.canvasId,
            envType: "default",
          }),
        };
      })
      .get("", ({ machine }) => {
        return machine.getMachineInfo();
      })
      .get(
        "/wait-for-state",
        async ({ machine, query }) => {
          await machine.waitForState(query.state);
        },
        {
          query: t.Object({
            state: t.Union([
              t.Literal("started"),
              t.Literal("stopped"),
              t.Literal("suspended"),
              t.Literal("destroyed"),
            ]),
          }),
          detail: {
            externalDocs: {
              url: "https://fly.io/docs/machines/api/machines-resource/#wait-for-a-machine-to-reach-a-specified-state",
              description: "This resource is a wrapper around fly's endpoint",
            },
          },
        }
      )
      .post(
        "/suspend",
        async ({ machine }) => {
          await machine.suspend();
        },
        {
          auth: "user",
        }
      )
      .post(
        "/start",
        async ({ machine }) => {
          await machine.start();
        },
        {
          auth: "user",
        }
      )
      .post(
        "/stop",
        async ({ machine }) => {
          await machine.stop();
        },
        {
          auth: "user",
        }
      );
  });
