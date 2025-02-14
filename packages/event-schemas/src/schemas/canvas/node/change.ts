import { BaseEvent } from "../../_base";
import { z } from "zod";

const CanvasNodeChange = BaseEvent.extend({
  event: z.literal("canvas.node.change"),
  canvasId: z.string().uuid(),
  nodeId: z.string().uuid(),
});

export default CanvasNodeChange;
export type CanvasNodeChange = z.infer<typeof CanvasNodeChange>;
