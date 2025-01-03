import { Event } from "event-schemas";
import { faktoryClient } from "./jobs";
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
};

class EventToJob {
  private configs: Array<EventToJobMappingConfig<Event["event"], Event>> = [];

  public add<T extends Event["event"]>(
    config: EventToJobMappingConfig<T, Extract<Event, { event: T }>>
  ) {
    const existing = this.configs.find(
      (c) => config.event === c.event && config.job === c.job
    );

    if (existing) {
      throw new Error(
        `already configured a ${config.event} => ${config.job} mapping`
      );
    }
    this.configs.push(
      config as unknown as EventToJobMappingConfig<Event["event"], Event>
    );
  }

  public async handleEvent(event: Event) {
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

    const payload = config.transform ? await config.transform(event) : event;

    await faktoryClient.job(config.job, payload).push();
  }
}

const eventToJob = new EventToJob();
export default eventToJob;
