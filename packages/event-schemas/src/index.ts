import { z } from "zod";
import canvasEvents from "./schemas/canvas";

export default [...canvasEvents] as const;

export type SchemaMap = Record<string, z.ZodType>;
