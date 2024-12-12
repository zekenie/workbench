import { z } from "zod";

export const BaseEvent = z.object({
  eventId: z
    .string()
    .uuid()
    .default(() => crypto.randomUUID())
    .optional(),
  timestamp: z.coerce
    .date()
    .default(() => new Date())
    .optional(),
  event: z.string(),
});

export type BaseEvent = z.infer<typeof BaseEvent>;
