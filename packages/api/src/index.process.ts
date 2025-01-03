import swagger from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { startWorker } from "./worker.process";
import { logger } from "@bogeychan/elysia-logger";

import { auth } from "./auth/routes";
import { canvasRoutes } from "./canvas/routes";
import { compilerRoutes } from "./compiler/routes";
import { snapshotRoutes } from "./snapshot/routes";
import { runtimeRoutes } from "./runtime/routes";
import { pollOutboxEvents } from "./outbox.process";
import { registerCleanupEventHandlers } from "./lib/process-cleanup";

registerCleanupEventHandlers();

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
  .use(compilerRoutes)
  .use(snapshotRoutes)
  .use(auth)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

// DEPLOYMENT: in prod, don't do this. these need to run on other processes
await startWorker().catch((err) =>
  console.error("failed to start workers", err)
);
await pollOutboxEvents().catch((err) => {
  console.error("Outbox: Fatal error in poller:", err);
  process.exit(1);
});

export type App = typeof app;
