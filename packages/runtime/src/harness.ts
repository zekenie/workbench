import { CompiledCanvas, CompiledNode, Compiler } from "compiler";
import { createAuthenticatedClient } from "./backend";
import { SourceFile } from "./source-file";
import type { RuntimeValue } from "./types";
import { EventEmitter, on } from "events";
import { createRuntime } from "./runtime";

type RuntimeConfig = {
  canvasId?: string;
  apiId?: string;
  apiSecret?: string;
  apiDomain?: string;
  onValueChange?: (id: string, value: RuntimeValue) => void;
  source: string;
};

export class Harness {
  private emitter: EventEmitter = new EventEmitter();
  private updateNode?: (node: CompiledNode) => void;
  private source: SourceFile;
  private compiler: Compiler = new Compiler();
  private compiledCanvas?: CompiledCanvas;
  values: Record<string, RuntimeValue> = {};

  constructor(private readonly config: RuntimeConfig) {
    this.source = new SourceFile({ path: this.config.source });
  }

  get clock() {
    return this.source.snapshot.clock;
  }

  private async digestsMatch(digest: string) {
    console.log(await this.source.hash, digest);
    return (await this.source.hash) === digest;
  }

  async load() {
    await this.source.load();

    const compiled = await this.compile();

    this.updateNode = (
      await createRuntime(compiled?.nodes || [], (id, val) =>
        this.onValueChange(id, val)
      )
    ).updateNode;

    console.log("values", this.values);
  }

  async compile() {
    try {
      const compiledCanvas = await this.compiler.compile(this.source.snapshot);
      this.compiledCanvas = compiledCanvas;
      return compiledCanvas;
    } catch (e) {
      console.log(e);
    }
  }

  async startWatchingLiveEdits() {
    console.log("harness config", this.config);
    if (!this.config.apiDomain) {
      return;
    }
    if (!this.config.canvasId) {
      return;
    }

    if (!this.config.apiId) {
      return;
    }

    if (!this.config.apiSecret) {
      return;
    }

    console.log("passed gates");

    const { data, status, error } = await createAuthenticatedClient(
      this.config.apiId,
      this.config.apiSecret,
      this.config.apiDomain
    ).snapshots["snapshot-stream"].get({
      query: { id: this.config.canvasId, clock: this.clock },
    });
    if (!data) {
      console.log({ data, status, error: error.value });
      throw new Error("no data");
    }
    if (!("next" in data)) {
      throw new Error();
    }
    for await (const chunk of data) {
      console.log("CHUNK!", chunk);
      switch (chunk.type) {
        case "digest":
          // if digests do not match
          if (!(await this.digestsMatch(chunk.digest))) {
            // ** Todo **
            // handle the case where somehow we lost a message and we
            // need to bail on the watching process and resubscribe
            // from our last known good clock

            // for now throw an error
            if (this.clock > 0) {
              console.warn(
                "mismatches between digest and expected digest. might have lost a message"
              );
            }
          }

          await this.source.save();
          try {
            await this.compile();
          } catch (e) {
            console.warn("unable to compile because", e);
          }
          await this.syncRuntime();
          this.emitter.emit("digest", { digest: chunk.digest });
          break;
        case "patch":
          this.source.patch([chunk.patch]);
          break;
      }
    }
  }

  private onValueChange = (id: string, value: RuntimeValue): void => {
    this.values[id] = value;
    if (this.config.onValueChange) {
      this.config.onValueChange(id, value);
    }

    this.emitter.emit("value", { id, value });
  };

  private async syncRuntime() {
    if (!this.updateNode) {
      throw new Error(
        "cannot sync runtime because it has not been created yet"
      );
    }
    const nodes = this.compiledCanvas?.nodes;
    if (nodes && this.updateNode) {
      console.log("about to update nodes", nodes.length);
      nodes.forEach(this.updateNode);
    }
  }

  get valueStream(): AsyncIterable<{ id: string; value: RuntimeValue }> {
    const self = this;
    return {
      async *[Symbol.asyncIterator]() {
        // for (const [id, value] of Object.entries(self.values)) {
        //   yield { id, value };
        // }
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
