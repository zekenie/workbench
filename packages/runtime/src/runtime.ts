// import { CompiledCanvas, CompiledNode } from "compiler";
// @ts-expect-error
import { Runtime } from "@observablehq/runtime";
import type { RuntimeValue } from "./types";
import type { CompiledNode } from "compiler";

type OnChange = (id: string, value: RuntimeValue) => void;

class Inspector {
  value?: unknown;
  error?: unknown;
  constructor(
    readonly id: string,
    readonly onChange: OnChange,
  ) {}

  pending() {
    console.log("it is pending");
    this.onChange(this.id, {
      state: "pending",
    });
  }

  fulfilled(value: unknown) {
    this.onChange(this.id, {
      state: "fulfilled",
      value,
    });
  }

  rejected(error: unknown) {
    this.onChange(this.id, {
      state: "rejected",
      error,
    });
  }
}

type Variable = any;

export async function createRuntime(
  compiled: CompiledNode[],
  onChange: OnChange,
) {
  const runtime = new Runtime();
  const module = runtime.module();
  const variableMap: Record<
    string,
    { hash: string; inspector: Inspector; variable: Variable }
  > = {};

  async function updateNode(node: CompiledNode) {
    console.log("updateNode", node);
    const nodeHash = await node.compiledCodeHash();
    if (variableMap[node.codeName]) {
      // the node we're updating hasn't actually changed. noop
      if (variableMap[node.codeName].hash === nodeHash) {
        return;
      }
      variableMap[node.codeName].variable.delete();
    }
    const inspector = new Inspector(node.codeName, onChange);

    const variable = module
      .variable(inspector)
      .define(node.codeName, node.dependencies, eval(`(${node.compiledCode})`));

    variableMap[node.codeName] = {
      variable,
      hash: nodeHash,
      inspector,
    };
  }

  for (const node of compiled) {
    updateNode(node);
  }

  console.log("RUNTIME CREATED");
  setInterval(
    () =>
      console.log(
        Object.values(variableMap).map((thing) => thing.variable._value),
      ),
    2000,
  );
  return {
    updateNode,
  };
}
