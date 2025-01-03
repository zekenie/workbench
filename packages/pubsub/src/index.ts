import { createClient } from "@redis/client";
import { z } from "zod";
import { EventEmitter } from "events";

// Helper type to extract event type from schema
export type EventType<T> = T extends z.ZodType<infer U> ? U : never;

// New type for cross-publish configuration
type CrossPublishConfig = {
  crossPublish?: string[];
};

// Helper type to check if a message has a specific key
type HasKey<T, K extends string> = T extends { [key in K]: any } ? T : never;

export class PubSub<TEventSchema extends z.ZodType<any>> {
  private publisher: ReturnType<typeof createClient>;
  private subscriber: ReturnType<typeof createClient>;
  private eventEmitters: Map<string, EventEmitter>;
  private crossPublishKeys: string[];

  constructor(
    redisUrl: string,
    _schemas: readonly TEventSchema[],
    config: CrossPublishConfig = {}
  ) {
    this.publisher = createClient({ url: redisUrl });
    this.subscriber = createClient({ url: redisUrl });
    this.eventEmitters = new Map();
    this.crossPublishKeys = config.crossPublish ?? [];
  }

  async connect() {
    await Promise.all([this.publisher.connect(), this.subscriber.connect()]);
  }

  async disconnect() {
    for (const emitter of this.eventEmitters.values()) {
      emitter.removeAllListeners();
    }
    this.eventEmitters.clear();

    await Promise.all([
      this.publisher.disconnect(),
      this.subscriber.disconnect(),
    ]);
  }

  private getCrossPublishChannel(key: string, value: string): string {
    return `${key}:${value}`;
  }

  async publish<T extends EventType<TEventSchema>>(message: T): Promise<void> {
    try {
      // Publish to the main event channel
      await this.publisher.publish(message.event, JSON.stringify(message));

      // Publish to cross-publish channels if applicable
      for (const key of this.crossPublishKeys) {
        if (key in message) {
          const crossChannel = this.getCrossPublishChannel(
            key,
            (message as any)[key]
          );
          await this.publisher.publish(crossChannel, JSON.stringify(message));
        }
      }
    } catch (error) {
      throw new Error(`Failed to publish message: ${error}`);
    }
  }

  async subscribe<T extends EventType<TEventSchema>>(
    eventKey: T["event"],
    callback: (message: T) => Promise<void> | void
  ): Promise<void> {
    await this.subscriber.subscribe(eventKey, async (message) => {
      try {
        const data = JSON.parse(message);
        await callback(data as T);
      } catch (error) {
        console.error(`Error processing message for event ${eventKey}:`, error);
      }
    });
  }

  async crossSubscribe<T extends EventType<TEventSchema>, K extends string>(
    key: K,
    value: string,
    callback: (message: HasKey<T, K>) => Promise<void> | void
  ): Promise<void> {
    const channel = this.getCrossPublishChannel(key, value);
    await this.subscriber.subscribe(channel, async (message) => {
      try {
        const data = JSON.parse(message);
        await callback(data as HasKey<T, K>);
      } catch (error) {
        console.error(
          `Error processing message for channel ${channel}:`,
          error
        );
      }
    });
  }

  async *[Symbol.asyncIterator]<T extends EventType<TEventSchema>>(
    eventKey: T["event"]
  ): AsyncIterableIterator<T> {
    if (!this.eventEmitters.has(eventKey)) {
      this.eventEmitters.set(eventKey, new EventEmitter());
    }
    const emitter = this.eventEmitters.get(eventKey)!;

    await this.subscriber.subscribe(eventKey, async (message) => {
      try {
        const data = JSON.parse(message);
        emitter.emit("message", data);
      } catch (error) {
        emitter.emit("error", error);
      }
    });

    try {
      while (true) {
        const message = await new Promise((resolve, reject) => {
          emitter.once("message", resolve);
          emitter.once("error", reject);
        });
        yield message as T;
      }
    } finally {
      emitter.removeAllListeners();
      await this.subscriber.unsubscribe(eventKey);
      this.eventEmitters.delete(eventKey);
    }
  }

  subscribeIterator<T extends EventType<TEventSchema>>(
    eventKey: T["event"]
  ): AsyncIterableIterator<T> {
    const iterator = this[Symbol.asyncIterator]<T>(eventKey);
    return {
      ...iterator,
      [Symbol.asyncIterator]() {
        return iterator;
      },
    };
  }

  async *crossSubscribeIterator<
    T extends EventType<TEventSchema>,
    K extends string,
  >(key: K, value: string): AsyncIterableIterator<HasKey<T, K>> {
    const channel = this.getCrossPublishChannel(key, value);

    if (!this.eventEmitters.has(channel)) {
      this.eventEmitters.set(channel, new EventEmitter());
    }
    const emitter = this.eventEmitters.get(channel)!;

    await this.subscriber.subscribe(channel, async (message) => {
      try {
        const data = JSON.parse(message);
        emitter.emit("message", data);
      } catch (error) {
        emitter.emit("error", error);
      }
    });

    try {
      while (true) {
        const message = await new Promise((resolve, reject) => {
          emitter.once("message", resolve);
          emitter.once("error", reject);
        });
        yield message as HasKey<T, K>;
      }
    } finally {
      emitter.removeAllListeners();
      await this.subscriber.unsubscribe(channel);
      this.eventEmitters.delete(channel);
    }
  }
}
