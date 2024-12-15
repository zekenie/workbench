export type CompiledNode = {
  compiledCodeHash: string;
  codeName: string;
  compiledCode: string;
  dependencies: string[];
};

export type RuntimeValue =
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
