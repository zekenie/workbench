import { backendClient } from "./backend";
import { createRuntime } from "./runtime";
import type { CompiledNode, RuntimeValue } from "./types";
import { EventEmitter, on } from "events";

type LiveEditConfig = {
  canvasId: string;
};

type RuntimeConfig = {
  // initial file?
  liveEdit?: LiveEditConfig;
  onChange?: (id: string, value: RuntimeValue) => void;
};

export class Harness {
  private emitter: EventEmitter = new EventEmitter();
  private updateNode?: (node: CompiledNode) => void;
  constructor(private readonly config: RuntimeConfig) {}

  async startWatchingLiveEdits() {
    if (!this.config.liveEdit) {
      return;
    }
    const { data } = await backendClient.canvases.compiled.get({
      query: { id: this.config.liveEdit.canvasId },
    });
    for await (const chunk of data!) {
      switch (chunk.type) {
        case "original":
          await this.handleOriginalDocument(chunk.original);
          break;
        case "changed":
          this.handleChanged(chunk.changed);
          break;
        default:
          throw new Error("unexpected event");
      }
    }
  }

  private onValueChange = (id: string, value: RuntimeValue): void => {
    if (this.config.onChange) {
      this.config.onChange(id, value);
    }

    this.emitter.emit("value", { id, value });
  };

  private async handleOriginalDocument(original: CompiledNode[]) {
    const { updateNode } = await createRuntime(original, this.onValueChange);
    this.updateNode = updateNode;
  }

  private handleChanged(changed: CompiledNode[]) {
    if (this.updateNode) {
      changed.forEach(this.updateNode);
    }
  }

  get valueStream(): AsyncIterable<{ id: string; value: RuntimeValue }> {
    const self = this;
    return {
      async *[Symbol.asyncIterator]() {
        for await (const [value] of on(self.emitter, "value")) {
          yield value;
        }
      },
    };
  }

  // do we want clients to be able to post stuff back?
  // we def want to be able to like pause and play certain nodes
  //
}
