// router.ts
import type { Harness } from "../harness";
import { handleEventsRoute, handleValuesRoute } from "./routes";

type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";
type RouteKey = `${HttpMethod} ${string}`;

// Simple CORS headers for permissive access
function addCorsHeaders(response: Response): Response {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

export async function router(
  req: Request,
  harness: Harness,
): Promise<Response> {
  const url = new URL(req.url);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return addCorsHeaders(new Response(null, { status: 204 }));
  }

  // Route handlers
  const routes: Record<RouteKey, (req: Request) => Promise<Response>> = {
    "GET /events": () => handleEventsRoute(req, harness),
    "GET /values": () => handleValuesRoute(req, harness),
    "GET /health": async () => {
      return new Response(null, {
        status: 200,
      });
    },
    // Add new routes here in the format "METHOD /path"
  };

  const routeKey = `${req.method} ${url.pathname}` as RouteKey;
  const handler = routes[routeKey];

  if (handler) {
    const response = await handler(req);
    return addCorsHeaders(response);
  }

  return addCorsHeaders(new Response("Not Found", { status: 404 }));
}
