import type {
  TLArrowBinding,
  TLRecord,
  TLStore,
  UnknownRecord,
} from "@tldraw/tldraw";
import { groupBy, keyBy } from "lodash-es";
import {
  type Action,
  dependencyReducer,
  type DependencyState,
} from "./dependency-state.ts";

export class DependencyGraph {
  private store?: TLStore;
  public _dependencies: DependencyState = {};
  private onDependencyChange: (dependencies: DependencyState) => void;

  constructor({
    store,
    initialState,
    onDependencyChange,
  }: {
    store?: TLStore;
    onDependencyChange: (dependencies: DependencyState) => void;
    initialState?: UnknownRecord[];
  }) {
    this.store = store;
    this.onDependencyChange = onDependencyChange;
    this.handleAddedRecords(initialState || this.store?.allRecords() || []);
  }

  public get dependencies(): DependencyState {
    return this._dependencies;
  }

  public listen() {
    if (!this.store) {
      throw new Error("cannot listen when theres no store, bruh");
    }
    return this.store.listen(
      async (historyRecord) => {
        const dependenciesBeforeChanges = this._dependencies;
        const { added, removed, updated } = historyRecord.changes;

        for (const removedRecord of Object.values(removed)) {
          this.dispatch({
            type: "REMOVE_NODE",
            payload: {
              id: removedRecord.id,
            },
          });
        }
        for (const [before] of Object.values(updated)) {
          this.dispatch({
            type: "REMOVE_NODE",
            payload: {
              id: before.id,
            },
          });
        }
        const newUpdates = Object.values(updated).map(([, after]) => after);
        this.handleAddedRecords(newUpdates);

        this.handleAddedRecords(Object.values(added));

        const dependenciesAfterChanges = this._dependencies;

        if (dependenciesAfterChanges !== dependenciesBeforeChanges) {
          this.onDependencyChange(this._dependencies);
        }
      },
      {
        scope: "document",
      }
    );
  }

  private dispatch(action: Action) {
    this._dependencies = dependencyReducer(this._dependencies, action);
  }

  private handleAddedRecords(records: UnknownRecord[]) {
    const bindings = records.filter((rec) => rec.typeName === "binding");

    return Object.values(groupBy(bindings, "fromId")).forEach(
      (bindingRecords) => {
        const byTerminal = keyBy(
          bindingRecords,
          (b: TLArrowBinding) => b.props?.terminal
        ) as Record<string, TLArrowBinding>;

        const toId = byTerminal.end?.toId;
        const fromId = byTerminal.start?.toId;

        if (toId && fromId) {
          this.dispatch({
            type: "ADD_DEPENDENCY",
            payload: {
              id: toId,
              dependency: fromId,
            },
          });
        }
      }
    );
  }
}
