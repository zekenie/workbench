import type { Harness } from "../harness";
import type { Serve, ServeOptions } from "bun";
import { router } from "./router";
import { startAndKeepWatchingLiveEdits } from "./retry";

/**
 * This creates a **dev** server that passed a harness.
 * It watches site for changes and updates the runtime.
 * If the subscription for new compiled code fails it will
 * try to reconnect with exponential backoff
 */
export async function createServer<T>({
  harness,
  serverOptions = {},
}: {
  harness: Harness;
  serverOptions: Omit<ServeOptions, "fetch">;
}) {
  const server = Bun.serve({
    ...serverOptions,
    fetch: (req) => router(req, harness),
  });

  const liveEditPromise = startAndKeepWatchingLiveEdits({ harness });

  return { liveEditPromise, server };
}
