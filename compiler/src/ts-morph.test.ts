import { describe, expect, it } from "bun:test";
import { NodeTransformer } from "./ts-morph";
import { format } from "prettier";

const formatCode = async (code: string) => {
  return format(code, {
    parser: "typescript",
    semi: true,
  });
};

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
      expect(await formatCode(result.expr)).toBe(
        await formatCode(`function expr() { return 3; }`)
      );
    });

    it("should treat function expressions as simple expressions", async () => {
      const nodes = [
        {
          id: "expr",
          code: "function foo() { return 'hi' }",
          dependencies: [],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(await formatCode(result.expr)).toBe(
        await formatCode(`function foo() { return 'hi' }`)
      );
    });

    it("should treat async function expressions as simple expressions", async () => {
      const nodes = [
        {
          id: "expr",
          code: "async function hi() { return 'hi' }",
          dependencies: [],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(await formatCode(result.expr)).toBe(
        await formatCode(`async function hi() { return 'hi' }`)
      );
    });

    it("should treat generator function expressions as simple expressions", async () => {
      const nodes = [
        {
          id: "expr",
          code: "function* foo() { return 'hi' }",
          dependencies: [],
        },
      ];

      const result = await transformer.transform(nodes);
      expect(await formatCode(result.expr)).toBe(
        await formatCode(`function* foo() { return 'hi' }`)
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
      expect(result.calc).toBe(
        await formatCode(`function calc(data, multiplier) {
          return data.value * multiplier;
        }`)
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
      expect(result.decl).toBe(
        await formatCode(`function decl() {
          return { x: 42 };
        }`)
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
      expect(result.multi).toBe(
        await formatCode(`function multi() {
          return { x: 42, y: 'hello' };
        }`)
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
      expect(result.arrow).toBe(
        await formatCode(`function arrow() {
          return x => x * 2;
        }`)
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
      expect(result.chain).toBe(
        await formatCode(`function chain(arr) {
          return arr.map(x => x * 2).filter(x => x > 0);
        }`)
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
      expect(result.multiline).toBe(
        await formatCode(`function multiline(data) {
          return data
                    .filter(x => x > 0)
                    .map(x => x * 2);
        }`)
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
      expect(await formatCode(result.commented)).toBe(
        await formatCode(`function commented(data) {
          return data.value * 2;
        }`)
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
      expect(await formatCode(result.empty)).toBe(
        await formatCode(`function empty() {}`)
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
      expect(await formatCode(result.whitespace)).toBe(
        await formatCode(`function whitespace() {}`)
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
      expect(await formatCode(result.declWithDeps)).toBe(
        await formatCode(`function declWithDeps(input) {
          return { result: input.value * 2 };
        }`)
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
      expect(await formatCode(result.complex)).toBe(
        await formatCode(`function complex(data) {
          return (() => {
                    return data.value * 2 + 1;
                  })();
        }`)
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
      expect(result.multi).toBe(
        await formatCode(`function multi() {
          foo();
          bar();
        }`)
      );
    });
  });
});
