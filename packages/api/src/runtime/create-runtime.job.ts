import faktory from "faktory-worker";
import { RuntimeMachine } from "./runtime-machine";
import eventToJob from "../lib/event-to-job";

faktory.register("runtime.create", async (options: any) => {
  const { id } = options;
  try {
    await RuntimeMachine.create({
      canvasId: id,
      envType: "default",
      region: "ord",
    });
  } catch (e) {
    console.error(await (e as Response).json());
    throw new Error("failed to create runtime", e as Error);
  }
});

eventToJob.add({
  event: "canvas.create",
  job: "runtime.create",
  transform(e) {
    return { id: e.canvasId };
  },
});
