import { DependencyGraph } from "dependencies";
import { snapshot } from "./snapshot";
import type { RoomSnapshot } from "@tldraw/sync-core";
import type { DependencyState } from "../../dependencies/dist/dependency-state";

export function extractDependencies(snapshot: RoomSnapshot): DependencyState {
  const dependencies = new DependencyGraph({
    initialState: snapshot.documents.map((d) => d.state),
    onDependencyChange() {},
  }).dependencies;

  return dependencies;
}
