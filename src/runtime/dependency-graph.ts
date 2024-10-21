import { TLArrowBinding, TLRecord, TLStore } from "@tldraw/tldraw";
import { groupBy, keyBy } from "lodash-es";
import { Action, dependencyReducer, DependencyState } from "./dependency-state";

export class DependencyGraph {
  private store: TLStore;
  private dependencies: DependencyState = {};
  private onDependencyChange: (dependencies: DependencyState) => void;

  constructor({
    store,
    onDependencyChange,
  }: {
    store: TLStore;
    onDependencyChange: (dependencies: DependencyState) => void;
  }) {
    this.store = store;
    this.onDependencyChange = onDependencyChange;
    this.handleAddedRecords(this.store.allRecords());
  }

  public listen() {
    return this.store.listen(
      async (historyRecord) => {
        const dependenciesBeforeChanges = this.dependencies;
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

        const dependenciesAfterChanges = this.dependencies;

        if (dependenciesAfterChanges !== dependenciesBeforeChanges) {
          this.onDependencyChange(this.dependencies);
        }
      },
      {
        scope: "document",
      }
    );
  }

  private dispatch(action: Action) {
    this.dependencies = dependencyReducer(this.dependencies, action);
  }

  private handleAddedRecords(records: TLRecord[]) {
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
