import type { Harness } from "../harness";

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
