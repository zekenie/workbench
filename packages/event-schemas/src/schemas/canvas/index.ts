import snapshot, { type CanvasSnapshot } from "./snapshot";
import create, { type CanvasCreate } from "./create";

export default [snapshot, create];
export type CanvasEvent = CanvasSnapshot | CanvasCreate;
