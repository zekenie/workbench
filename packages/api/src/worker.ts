import faktory from "faktory-worker";
import "./compiler/compile.job.js";

export async function startWorker() {
  const worker = await faktory.work();

  worker.on("error", () => {
    // handle unexpected errors
  });

  worker.on("fail", ({ job, error }) => {
    // handle when a job fails
  });

  return worker;
}
