import { BaseEvent } from "../_base";
import { z } from "zod";

const CanvasSnapshot = BaseEvent.extend({
  event: z.literal("canvas.snapshot"),
  canvasId: z.string().uuid(),
  digest: z.string(),
  clock: z.number().int().nonnegative(),
});

export type CanvasSnapshot = z.infer<typeof CanvasSnapshot>;

export default CanvasSnapshot;
