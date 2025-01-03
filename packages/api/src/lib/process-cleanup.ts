import { once } from "lodash-es";
import { prisma } from "../db";
import { faktoryClient } from "./jobs";
import pubsub from "./pubsub";

const cleanup = once(async function cleanup() {
  console.log("Cleaning up...");
  try {
    await Promise.all([
      prisma.$disconnect(),
      faktoryClient.close(),
      pubsub.disconnect(),
    ]);
  } catch (err) {
    console.error("Cleanup error:", err);
    process.exit(1);
  }
  process.exit(0);
});

export const registerCleanupEventHandlers = once(() => {
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    cleanup();
  });
  process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled rejection:", reason);
    cleanup();
  });
});
