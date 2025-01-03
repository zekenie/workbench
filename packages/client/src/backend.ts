// wtf... weird version mismatch issue seemed to be resolved this way?????
import { treaty } from "../../../node_modules/@elysiajs/eden";
import type { App } from "../../api/src/index.process";

export const backendClient = treaty<App>("http://localhost:3000");

export type ClientType = typeof backendClient;
