import snapshot, { type CanvasSnapshot } from "./snapshot";
import create, { type CanvasCreate } from "./create";
import node, { type CanvasNodeEvent } from "./node";

export default [snapshot, create, node];
export type CanvasEvent = CanvasSnapshot | CanvasCreate | CanvasNodeEvent;
