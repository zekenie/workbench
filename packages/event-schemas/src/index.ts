import { z } from "zod";
import canvasEvents, { type CanvasEvent } from "./schemas/canvas";
import runtimeEvents, { type RuntimeEvent } from "./schemas/runtime";

export default [...canvasEvents, ...runtimeEvents] as const;

export type SchemaMap = Record<string, z.ZodType>;
export type Event = CanvasEvent | RuntimeEvent;
