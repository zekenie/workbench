import { BaseEvent } from "../_base";
import { z } from "zod";

export default BaseEvent.extend({
  event: z.literal("canvas.compile"),
  canvasId: z.string().uuid(),
});
