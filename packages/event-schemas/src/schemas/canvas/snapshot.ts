import { BaseEvent } from "../_base";
import { z } from "zod";

export default BaseEvent.extend({
  event: z.literal("canvas.snapshot"),
  canvasId: z.string().uuid(),
  digest: z.string(),
  clock: z.number().int().nonnegative(),
});
