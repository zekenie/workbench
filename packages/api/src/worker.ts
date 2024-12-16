import faktory from "faktory-worker";
import "./compiler/compile.job.js";
import { once } from "lodash-es";

export const startWorker = once(async () => {
  const worker = await faktory.work();

  worker.on("error", () => {
    // handle unexpected errors
  });

  worker.on("fail", ({ job, error }) => {
    // handle when a job fails
  });

  return worker;
});
