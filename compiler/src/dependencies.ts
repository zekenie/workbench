import { DependencyGraph } from "dependencies";
import { snapshot } from "./snapshot";
import type { RoomSnapshot } from "@tldraw/sync-core";

export function extractDependencies(snapshot: RoomSnapshot) {
  const dependencies = new DependencyGraph({
    initialState: snapshot.documents.map((d) => d.state),
    onDependencyChange() {},
  }).dependencies;

  return dependencies;
}
