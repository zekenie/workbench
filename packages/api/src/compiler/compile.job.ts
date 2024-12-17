import faktory from "faktory-worker";
import { compile } from "./service";
import pubsub from "../pubsub";

faktory.register("canvas.compile", async (options: any) => {
  const { id } = options;
  await compile({ id });
  await pubsub.publish({
    event: "canvas.compile",
    canvasId: id,
  });
});
