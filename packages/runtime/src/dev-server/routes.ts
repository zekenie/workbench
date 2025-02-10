import type { Harness } from "../harness";
import { createPage } from "../object-pagination";

export async function handleValuesRoute(
  req: Request,
  harness: Harness,
): Promise<Response> {
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") || undefined;
  const direction = (url.searchParams.get("direction") || "wide") as
    | "wide"
    | "deep";
  const pageSize = parseInt(url.searchParams.get("pageSize") || "100", 10);

  const page = createPage({
    object: harness.values,
    cursor,
    direction,
    pageSize,
  });

  return new Response(JSON.stringify(page.toJSON()), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });
}

export async function handleEventsRoute(req: Request, harness: Harness) {
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial values
      for (const [id, value] of Object.entries(harness.values)) {
        const sseData = [
          `id: ${crypto.randomUUID()}`,
          `event: valueChange`,
          `data: ${JSON.stringify({ id, value })}`,
          "\n",
        ].join("\n");
        controller.enqueue(new TextEncoder().encode(sseData));
      }

      // Set up heartbeat interval
      const heartbeat = setInterval(() => {
        const heartbeatData = [
          `id: ${crypto.randomUUID()}`,
          `event: heartbeat`,
          `data: ""`,
          "\n",
        ].join("\n");
        controller.enqueue(new TextEncoder().encode(heartbeatData));
      }, 30000); // Send heartbeat every 30 seconds

      try {
        // Listen for new values
        for await (const value of harness.valueStream) {
          const sseData = [
            `id: ${crypto.randomUUID()}`,
            `event: valueChange`,
            `data: ${JSON.stringify(value)}`,
            "\n",
          ].join("\n");
          controller.enqueue(new TextEncoder().encode(sseData));
        }
      } finally {
        // Clean up on stream end
        clearInterval(heartbeat);
      }

      // Clean up on request abort
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
