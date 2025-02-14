import { PubSub } from "pubsub";
import events from "event-schemas";
import { prisma } from "../db";
import { randomUUIDv7 } from "bun";
import { createCanvas } from "../canvas/service";

const pubsub = new PubSub(Bun.env.REDIS_URL, events, {
  crossPublish: ["canvasId"],
});

await pubsub.connect();

export default pubsub as Omit<typeof pubsub, "publish">;

export const pubsubWithPublish = pubsub;

type PublishArgs = Parameters<(typeof pubsub)["publish"]>;

export async function publish(...args: PublishArgs) {
  const [event] = args;
  await prisma.event.create({
    data: {
      eventId: event.eventId || randomUUIDv7(),
      event: event.event,
      timestamp: event.timestamp || new Date(),
      payload: event,
    },
  });
}

export async function bulkPublish(events: PublishArgs[0][]) {
  await prisma.event.createMany({
    data: events.map((event) => ({
      eventId: event.eventId || randomUUIDv7(),
      event: event.event,
      timestamp: event.timestamp || new Date(),
      payload: event,
    })),
  });
}
