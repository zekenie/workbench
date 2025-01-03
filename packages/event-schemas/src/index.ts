import { z } from "zod";
import canvasEvents, { type CanvasEvent } from "./schemas/canvas";

export default [...canvasEvents] as const;

export type SchemaMap = Record<string, z.ZodType>;
export type Event = CanvasEvent;
