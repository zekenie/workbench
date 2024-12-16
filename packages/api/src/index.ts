import swagger from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { authenticatedRoutes } from "./authenticated.routes";
import { startWorker } from "./worker";

import { auth } from "./auth/routes";
import { canvasRoutes } from "./canvas/routes";
import { compilerRoutes } from "./compiler/routes";

export const app = new Elysia()
  .use(swagger())
  .use(cors())
  .use(authenticatedRoutes)
  .use(canvasRoutes)
  .use(compilerRoutes)
  .use(auth)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

// DEPLOYMENT: in prod, don't do this
await startWorker().catch((err) =>
  console.error("failed to start workers", err)
);

export type App = typeof app;
