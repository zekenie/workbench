import snapshot, { type CanvasSnapshot } from "./snapshot";
import compile, { type CanvasCompile } from "./compile";
import create, { type CanvasCreate } from "./create";

export default [snapshot, compile, create];
export type CanvasEvent = CanvasSnapshot | CanvasCompile | CanvasCreate;
