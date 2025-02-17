import { BaseEvent } from "../_base";
import { z } from "zod";

const CanvasNodeChange = BaseEvent.extend({
  event: z.literal("canvas.node-change"),
  canvasId: z.string().uuid(),
  nodeId: z.string().uuid(),
  type: z.string({
    description: "the shape type (ide, arrow, sticky, etc)",
  }),
  typeName: z.string({
    description: "https://tldraw.dev/reference/store/BaseRecord#typeName",
  }),
});

export default CanvasNodeChange;
export type CanvasNodeChange = z.infer<typeof CanvasNodeChange>;
