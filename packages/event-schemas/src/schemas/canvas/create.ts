import { BaseEvent } from "../_base";
import { z } from "zod";

const CanvasCreate = BaseEvent.extend({
  event: z.literal("canvas.create"),
  canvasId: z.string().uuid(),
});

export default CanvasCreate;
export type CanvasCreate = z.infer<typeof CanvasCreate>;
