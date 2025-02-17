import snapshot, { type CanvasSnapshot } from "./snapshot";
import create, { type CanvasCreate } from "./create";
import nodeChange, { type CanvasNodeChange } from "./node-change";

export default [snapshot, create, nodeChange];
export type CanvasEvent = CanvasSnapshot | CanvasCreate | CanvasNodeChange;
