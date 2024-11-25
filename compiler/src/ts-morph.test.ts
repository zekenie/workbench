import { describe, expect, it } from "bun:test";
import { NodeTransformer } from "./ts-morph";

describe("NodeTransformer", () => {
  const transformer = new NodeTransformer();

  describe("transform", () => {
    it("should handle simple expressions", async () => {
      const nodes = [
        {
          id: "expr",
          code: "1 + 2",
          dependencies: [],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("expr")).toBe(
        `function() {
  return 1 + 2;
}`
      );
    });

    it("should handle expressions with dependencies", async () => {
      const nodes = [
        {
          id: "calc",
          code: "data.value * multiplier",
          dependencies: ["data", "multiplier"],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("calc")).toBe(
        `function(data, multiplier) {
  return data.value * multiplier;
}`
      );
    });

    it("should handle single declarations", async () => {
      const nodes = [
        {
          id: "decl",
          code: "const x = 42",
          dependencies: [],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("decl")).toBe(
        `function() {
  const x = 42
  return { x };
}`
      );
    });

    it("should handle multiple declarations", async () => {
      const nodes = [
        {
          id: "multi",
          code: "const x = 42; let y = 'hello';",
          dependencies: [],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("multi")).toBe(
        `function() {
  const x = 42; let y = 'hello';
  return { x, y };
}`
      );
    });
  });

  describe("expression detection", () => {
    it("should handle arrow functions", async () => {
      const nodes = [
        {
          id: "arrow",
          code: "x => x * 2",
          dependencies: [],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("arrow")).toBe(
        `function() {
  return x => x * 2;
}`
      );
    });

    it("should handle method chains", async () => {
      const nodes = [
        {
          id: "chain",
          code: "arr.map(x => x * 2).filter(x => x > 0)",
          dependencies: ["arr"],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("chain")).toBe(
        `function(arr) {
  return arr.map(x => x * 2).filter(x => x > 0);
}`
      );
    });

    it("should handle multiline expressions", async () => {
      const nodes = [
        {
          id: "multiline",
          code: `
          data
            .filter(x => x > 0)
            .map(x => x * 2)
        `,
          dependencies: ["data"],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("multiline")).toBe(
        `function(data) {
  return data
            .filter(x => x > 0)
            .map(x => x * 2);
}`
      );
    });

    it("should handle expressions with comments", async () => {
      const nodes = [
        {
          id: "commented",
          code: `
          // This is a comment
          data.value * 2 // Multiply by 2
        `,
          dependencies: ["data"],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("commented")).toBe(
        `function(data) {
  return data.value * 2;
}`
      );
    });
  });

  describe("edge cases", () => {
    it("should handle empty code", async () => {
      const nodes = [
        {
          id: "empty",
          code: "",
          dependencies: [],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("empty")).toBe(
        `function() {
  
}`
      );
    });

    it("should handle whitespace-only code", async () => {
      const nodes = [
        {
          id: "whitespace",
          code: "   \n   \t   ",
          dependencies: [],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("whitespace")).toBe(
        `function() {
  
}`
      );
    });

    it("should handle declarations with dependencies", async () => {
      const nodes = [
        {
          id: "declWithDeps",
          code: "const result = input.value * 2;",
          dependencies: ["input"],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("declWithDeps")).toBe(
        `function(input) {
  const result = input.value * 2;
  return { result };
}`
      );
    });

    it("should handle complex expressions", async () => {
      const nodes = [
        {
          id: "complex",
          code: `
          (() => {
            const temp = data.value * 2;
            return temp + 1;
          })()
        `,
          dependencies: ["data"],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("complex")).toBe(
        `function(data) {
  return (() => {
            const temp = data.value * 2;
            return temp + 1;
          })();
}`
      );
    });

    it("should handle multiple statements as non-expression", async () => {
      const nodes = [
        {
          id: "multi",
          code: "foo(); bar()",
          dependencies: [],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(result.get("multi")).toBe(
        `function() {
  foo(); bar()
}`
      );
    });
  });
});
