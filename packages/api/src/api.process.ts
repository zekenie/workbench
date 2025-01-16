import swagger from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { logger } from "@bogeychan/elysia-logger";

import { auth } from "./auth/routes";
import { canvasRoutes } from "./canvas/routes";
import { snapshotRoutes } from "./snapshot/routes";
import { runtimeRoutes } from "./runtime/routes";
import { setupProcess } from "./lib/process-cleanup";

export const app = new Elysia({
  serve: {
    idleTimeout: 60,
  },
})
  .use(swagger())
  .use(logger())
  .use(cors())

  .use(canvasRoutes)
  .use(runtimeRoutes)
  .use(snapshotRoutes)
  .use(auth);
// .listen(Bun.env.PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

// DEPLOYMENT: in prod, don't do this. these need to run on other processes
// await startWorker().catch((err) =>
//   console.error("failed to start workers", err)
// );
// await pollOutboxEvents().catch((err) => {
//   console.error("Outbox: Fatal error in poller:", err);
//   process.exit(1);
// });

export type App = typeof app;

export async function startProcess() {
  setupProcess();
  app.listen(Bun.env.PORT);
}
