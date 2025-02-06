import { BaseEvent } from "../_base";
import { z } from "zod";

const StateChange = BaseEvent.extend({
  event: z.literal("runtime.state-change"),
  canvasId: z.string().uuid(),
  prevState: z.string().min(1).max(255),
  newState: z.string().min(1).max(255),
  canvasEnvironmentId: z.string().uuid(),
});

export default StateChange;
export type StateChange = z.infer<typeof StateChange>;
