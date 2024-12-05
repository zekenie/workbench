import swagger from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { authenticatedRoutes } from "./authenticated.routes";

import { auth } from "./auth/routes";
import { canvasRoutes } from "./canvas/routes";

const app = new Elysia()
  .use(swagger())
  .use(cors())
  .use(authenticatedRoutes)
  .use(canvasRoutes)
  .use(auth)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
