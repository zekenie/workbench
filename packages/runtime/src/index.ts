#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { createServer } from "./dev-server";
import { Harness } from "./harness";

async function main() {
  const { values: config } = parseArgs({
    options: {
      apiDomain: {
        type: "string",
        short: "a",
        default: Bun.env.API_DOMAIN,
      },
      apiId: {
        type: "string",
        default: Bun.env.API_ID,
      },
      apiSecret: {
        type: "string",
        default: Bun.env.API_SECRET,
      },
      source: {
        type: "string",
        short: "s",
        default: Bun.env.SOURCE,
      },
      canvasId: {
        type: "string",
        short: "c",
        default: Bun.env.CANVAS_ID,
      },
      port: {
        type: "string",
        short: "p",
        default: Bun.env.PORT,
      },
    },
  });

  if (!config.source) {
    throw new Error();
  }

  // Create the harness with the source file and live edit config
  const harness = new Harness({
    source: config.source,
    apiDomain: config.apiDomain,
    canvasId: config.canvasId!,
    apiId: config.apiId,
    apiSecret: config.apiSecret,
  });

  // Load the initial source file
  await harness.load();

  // Compile the initial state
  if (harness.clock > 0) {
    await harness.compile();
  }

  // Create and start the dev server
  const { server, liveEditPromise } = await createServer({
    harness,
    serverOptions: {
      port: config.port ?? 3001,
    },
  });

  if (config.canvasId) {
    console.log(`Live edit enabled for canvas: ${config.canvasId}`);
  }

  // Handle server shutdown
  const shutdown = async () => {
    server.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Wait for the live edit promise to resolve or reject
  try {
    await liveEditPromise;
  } catch (err) {
    console.error("Live edit failed:", err);
    shutdown();
  }
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
