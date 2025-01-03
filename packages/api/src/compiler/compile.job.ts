import faktory from "faktory-worker";
import { compile } from "./service";
import { publish } from "../lib/pubsub";

faktory.register("canvas.compile", async (options: any) => {
  const { id } = options;
  await compile({ id });
  await publish({
    event: "canvas.compile",
    canvasId: id,
  });
});
