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
