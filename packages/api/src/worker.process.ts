import faktory from "faktory-worker";
import "./compiler/compile.job.js";
import "./runtime/create-runtime.job.js";
import { once } from "lodash-es";
import { registerCleanupEventHandlers } from "./lib/process-cleanup.js";

registerCleanupEventHandlers();

export const startWorker = once(async () => {
  const worker = await faktory.work();

  worker.on("error", () => {
    // handle unexpected errors
    console.log("error!");
  });

  worker.on("fail", ({ job, error }) => {
    // handle when a job fails
    console.log("job fails", { job, error });
  });

  return worker;
});
