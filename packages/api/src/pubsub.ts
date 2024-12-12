import { PubSub } from "pubsub";
import events from "event-schemas";

const pubsub = new PubSub(Bun.env.REDIS_URL, events, {
  crossPublish: ["canvasId"],
});

await pubsub.connect();

export default pubsub;
