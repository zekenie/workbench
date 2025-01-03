import faktory from "faktory-worker";
import { RuntimeMachine } from "./runtime-machine";
import eventToJob from "../lib/event-to-job";

faktory.register("runtime.create", async (options: any) => {
  console.log("job running");
  const { id } = options;
  await RuntimeMachine.create({
    canvasId: id,
    envType: "default",
    region: "ord",
  });
});

eventToJob.add({
  event: "canvas.create",
  job: "runtime.create",
  transform(e) {
    return { id: e.canvasId };
  },
});
