import faktory from "faktory-worker";
import eventToJob from "../lib/event-to-job";
import { summarizeSource } from "./summarize-source.service";

faktory.register("source-code.summarize-source", async (options: any) => {
  const { canvasId, nodeId } = options;
  await summarizeSource({ canvasId, nodeId });
});

eventToJob.add({
  event: "canvas.node-change",
  // if there are any events to the same node and same canvas
  // in the last 2s, skip them
  debounce: {
    time: 2000,
    by: (event) => {
      return {
        event: event.event,
        AND: [
          {
            payload: {
              path: ["canvasId"],
              equals: event.canvasId,
            },
          },
          {
            payload: {
              path: ["nodeId"],
              equals: event.nodeId,
            },
          },
        ],
      };
    },
  },
  job: "source-code.summarize-source",
  gate(e) {
    // we only want to enqueue the job with source code nodes
    return e.type === "IDE";
  },
  transform(e) {
    return { canvasId: e.canvasId, nodeId: e.nodeId };
  },
});
