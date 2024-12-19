#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { createServer } from "./dev-server";
import { Harness } from "./harness";

// Configuration types
type LiveEditConfig = {
  canvasId: string;
};

type Config = {
  liveEdit?: LiveEditConfig;
  port?: number;
};

async function loadConfig(configPath: string): Promise<Config> {
  try {
    const file = Bun.file(configPath);
    const exists = await file.exists();
    if (!exists) {
      return {};
    }
    return await file.json();
  } catch (err) {
    console.warn(`Warning: Failed to load config from ${configPath}:`, err);
    return {};
  }
}

async function main() {
  const {
    values: { source, config: configPath },
  } = parseArgs({
    options: {
      source: {
        type: "string",
        short: "s",
        default: "canvas.json",
      },
      config: {
        type: "string",
        short: "c",
        default: "runtime.config.json",
      },
    },
  });

  // Load config file
  const config = await loadConfig(configPath);

  // Create the harness with the source file and live edit config
  const harness = new Harness({
    sourceFile: source,
    liveEdit: config.liveEdit,
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

  console.log(`Server started at http://localhost:${server.port}`);
  if (config.liveEdit) {
    console.log(`Live edit enabled for canvas: ${config.liveEdit.canvasId}`);
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
