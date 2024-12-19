import type { Harness } from "../harness";

export async function handleEventsRoute(req: Request, harness: Harness) {
  const stream = new ReadableStream({
    async start(controller) {
      for (const [id, value] of Object.entries(harness.values)) {
        const sseData = [
          `id: ${crypto.randomUUID()}`,
          `event: valueChange`,
          `data: ${JSON.stringify({ id, value })}`,
          "\n",
        ].join("\n");
        controller.enqueue(new TextEncoder().encode(sseData));
      }
      for await (const value of harness.valueStream) {
        const sseData = [
          `id: ${crypto.randomUUID()}`,
          `event: valueChange`,
          `data: ${JSON.stringify(value)}`,
          "\n",
        ].join("\n");
        controller.enqueue(new TextEncoder().encode(sseData));
      }

      req.signal.addEventListener("abort", () => {
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
