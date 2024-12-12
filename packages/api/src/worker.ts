import faktory from "faktory-worker";
import "./canvas/compile.job.ts";

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
