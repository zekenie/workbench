import { CompiledCanvas, CompiledNode } from "compiler";
// @ts-expect-error
import { Runtime } from "@observablehq/runtime";

type Value =
  | {
      state: "pending";
    }
  | {
      state: "fulfilled";
      value: unknown;
    }
  | {
      state: "rejected";
      error: unknown;
    };

type OnChange = (id: string, value: Value) => void;

class Inspector {
  value?: unknown;
  error?: unknown;
  constructor(
    readonly id: string,
    readonly onChange: OnChange
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
  compiled: CompiledCanvas,
  onChange: OnChange
) {
  const runtime = new Runtime();
  const module = runtime.module();
  const inspectorMap: Record<string, Inspector> = {};
  const variableMap: Record<string, Variable> = {};

  function updateNode(node: CompiledNode) {
    if (variableMap[node.id]) {
      variableMap[node.id].delete();
    }
    inspectorMap[node.id] = new Inspector(node.id, onChange);

    console.log(node.id, node.compiledCode);

    const variable = module
      .variable(inspectorMap[node.id])
      .define(node.id, node.dependencies, eval(`(${node.compiledCode})`));

    variableMap[node.id] = variable;
  }

  for (const node of compiled) {
    updateNode(node);
  }

  return {
    updateNode,
  };
}
