// import { CompiledCanvas, CompiledNode } from "compiler";
// @ts-expect-error
import { Runtime } from "@observablehq/runtime";
import type { CompiledNode, RuntimeValue } from "./types";

type OnChange = (id: string, value: RuntimeValue) => void;

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
  compiled: CompiledNode[],
  onChange: OnChange
) {
  const runtime = new Runtime();
  const module = runtime.module();
  const inspectorMap: Record<string, Inspector> = {};
  const variableMap: Record<string, Variable> = {};

  function updateNode(node: CompiledNode) {
    if (variableMap[node.codeName]) {
      variableMap[node.codeName].delete();
    }
    inspectorMap[node.codeName] = new Inspector(node.codeName, onChange);

    console.log(node.codeName, node.compiledCode);

    const variable = module
      .variable(inspectorMap[node.codeName])
      .define(node.codeName, node.dependencies, eval(`(${node.compiledCode})`));

    variableMap[node.codeName] = variable;
  }

  for (const node of compiled) {
    updateNode(node);
  }

  return {
    updateNode,
  };
}
