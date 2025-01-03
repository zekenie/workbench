import { setTimeout } from "node:timers/promises";

import { EventStatus } from "@prisma/client";
import { prisma } from "./db";
import { pubsubWithPublish } from "./lib/pubsub";
import { Event } from "event-schemas";
import { setupProcess } from "./lib/process-cleanup";
import eventToJob from "./lib/event-to-job";

setupProcess();

async function selectPendingEventIds() {
  // Select IDs of pending events with FOR UPDATE SKIP LOCKED
  const pendingIds = await prisma.$queryRaw<{ eventId: string }[]>`
    SELECT "eventId"
    FROM "Event"
    WHERE status = 'PENDING'
    ORDER BY "timestamp" 
    LIMIT 100
    FOR UPDATE SKIP LOCKED
  `;
  return pendingIds.map((row) => row.eventId);
}

async function processOutboxEvents() {
  try {
    const events = await prisma.$transaction(async (tx) => {
      const pendingIds = await selectPendingEventIds();

      const events = await prisma.event.findMany({
        where: {
          eventId: {
            in: pendingIds,
          },
        },
      });

      if (events.length === 0) {
        return [];
      }

      // Update status to processing
      await prisma.event.updateMany({
        where: {
          eventId: {
            in: pendingIds,
          },
        },
        data: {
          status: EventStatus.PROCESSING,
        },
      });

      return events;
    });

    // Publish events outside transaction
    for (const event of events) {
      if (event.retryCount > 4) {
        await prisma.event.update({
          data: {
            status: EventStatus.FAILED,
          },
          where: {
            eventId: event.eventId,
          },
        });
        continue;
      }
      try {
        await Promise.all([
          eventToJob.handleEvent(event.payload as unknown as Event),
          pubsubWithPublish.publish(event.payload as unknown as Event),
        ]);
        await prisma.event.update({
          where: { eventId: event.eventId },
          data: {
            status: EventStatus.PUBLISHED,
          },
        });
      } catch (e) {
        console.error("error while handling event in outbox", {
          error: e,
          event,
        });
        // if we fail, put the slice back in pending
        await prisma.event.update({
          where: { eventId: event.eventId },
          data: {
            status: EventStatus.PENDING,
            retryCount: { increment: 1 },
            lastError: (e as Error).message,
          },
        });
      }
    }

    return events.length > 0;
  } catch (error) {
    console.error("Error processing outbox:", error);
    throw error;
  }
}

export async function pollOutboxEvents() {
  let catchCount = 0;
  while (true) {
    try {
      const eventsFound = await processOutboxEvents();

      // If no events found, wait before next poll
      if (!eventsFound) {
        await setTimeout(1000);
      }
    } catch (error) {
      if (catchCount > 4) {
        throw error;
      }
      console.error(`Error in poller (${catchCount}):`, error);
      catchCount++;
      // Linear backoff
      // Error | Time
      // ------|-------
      //   1   | 3_000
      //   2   | 4_000
      //   3   | 5_000
      //   4   | 6_000
      await setTimeout(1_000 + 1_000 * (catchCount + 1));
    }
  }
}

// Start the poller
