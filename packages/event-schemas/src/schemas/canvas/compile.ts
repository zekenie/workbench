import { BaseEvent } from "../_base";
import { z } from "zod";

const CanvasCompile = BaseEvent.extend({
  event: z.literal("canvas.compile"),
  canvasId: z.string().uuid(),
});

export type CanvasCompile = z.infer<typeof CanvasCompile>;
export default CanvasCompile;
