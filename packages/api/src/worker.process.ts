import faktory from "faktory-worker";
import "./runtime/create-runtime.job.js";
import { once } from "lodash-es";
import { setupProcess } from "./lib/process-cleanup.js";

setupProcess();

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
