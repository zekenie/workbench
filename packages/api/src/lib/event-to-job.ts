import { Event } from "event-schemas";
import { faktoryClient } from "./jobs";
import { prisma } from "../db";
import { Prisma } from "@prisma/client";
/**
 * This module's purpose is to manage a mapping between
 * events and jobs. Consumers of this module can map
 * events => jobs and cause a job to be enqueued as an
 * event is coming out of the outbox.
 */

type EventToJobMappingConfig<
  EventName extends Event["event"],
  E = Extract<Event, { event: EventName }>,
> = {
  event: EventName;
  job: string;
  transform?: (event: E) => unknown | Promise<unknown>;
  gate?: (event: E) => boolean | Promise<boolean>;
  debounce?: DebounceConfig<E>;
};

type DebounceConfig<T extends Event> = {
  time: number;
  by: (event: T) => Prisma.EventWhereInput;
};

class EventToJob {
  private configs: Array<EventToJobMappingConfig<Event["event"], Event>> = [];

  public add<T extends Event["event"]>(
    config: EventToJobMappingConfig<T, Extract<Event, { event: T }>>,
  ) {
    const existing = this.configs.find(
      (c) => config.event === c.event && config.job === c.job,
    );

    if (existing) {
      throw new Error(
        `already configured a ${config.event} => ${config.job} mapping`,
      );
    }
    this.configs.push(
      config as unknown as EventToJobMappingConfig<Event["event"], Event>,
    );
  }

  private shouldDebounce = async <T extends Event>(
    config: DebounceConfig<T>,
    event: T,
  ) => {
    const recentEventCount = await prisma.event.count({
      where: {
        ...config.by(event),
        timestamp: {
          gte: new Date(Date.now() - config.time),
        },
      },
    });

    return recentEventCount > 0;
  };

  public async handleEvent<T extends Event>(event: T) {
    const config = this.configs.find((c) => c.event === event.event);
    if (!config) {
      return;
    }
    /**
     * If there is a gate, and the gate doesn't pass, stop
     */
    if (config.gate && !(await config.gate(event))) {
      return;
    }

    if (
      config.debounce &&
      (await this.shouldDebounce(config.debounce, event))
    ) {
      // ignore it, we're debouncing this.
      return;
    }

    const payload = config.transform ? await config.transform(event) : event;

    await faktoryClient.job(config.job, payload).push();
  }
}

const eventToJob = new EventToJob();
export default eventToJob;
