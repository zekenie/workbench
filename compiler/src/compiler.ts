import { parse, transform, print } from "@swc/core";
import type { Program } from "@swc/core";

interface Node {
  id: string;
  code: string;
  dependencies: string[];
}

class NodeTransformer {
  /**
   * Determines if a program consists of a single expression
   * Examples:
   * - "x + y" -> true
   * - "data.nums.map(x => x * 2)" -> true
   * - "const x = 42" -> false
   * - "foo(); bar()" -> false (multiple statements)
   */
  private isExpression(ast: Program): boolean {
    if (ast.type !== "Module") return false;

    const body = ast.body;
    if (body.length !== 1) return false;

    const statement = body[0];
    return statement.type === "ExpressionStatement";
  }

  async transform(nodes: Node[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    for (const node of nodes) {
      const ast = await parse(node.code, {
        syntax: "typescript",
        target: "es2024",
        comments: false,
        tsx: false,
      });

      const isExpression = this.isExpression(ast);

      const transformed = await transform(ast, {
        minify: false,
        plugin: (program: Program) => {
          return this.transformNodeReferences(program);
        },
      });

      transformed.code;

      const wrappedCode = this.wrapInFunction(
        transformed.code,
        node.dependencies,
        isExpression
      );
      result.set(node.id, wrappedCode);
    }

    return result;
  }

  private transformNodeReferences(program: Program): Program {
    return program;
  }

  /**
   * Wraps code in a function, handling expressions and declarations differently
   */
  private wrapInFunction(
    code: string,
    paramNames: string[] = [],
    isExpression: boolean
  ): string {
    code = code.trim().replace(/;$/, "");

    // For expressions, directly return the result
    if (isExpression) {
      return `function(${paramNames.join(", ")}) {
  return ${code};
}`;
    }

    // For declarations, extract declared variables and return them as an object
    const declarations = code
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.startsWith("const ") ||
          line.startsWith("let ") ||
          line.startsWith("var ")
      )
      .map((line) => {
        const match = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
        return match ? match[1] : null;
      })
      .filter((name): name is string => name !== null);

    console.log({ declarations });

    if (declarations.length > 0) {
      return `function(${paramNames.join(", ")}) {
  ${code};
  return { ${declarations.join(", ")} };
}`;
    }

    // Fallback for any other case
    return `function(${paramNames.join(", ")}) {
  ${code}
}`;
  }
}

// Example usage:
async function example() {
  const transformer = new NodeTransformer();

  const nodes = [
    {
      id: "data",
      code: "const nums = [1,2,3]",
      dependencies: [],
    },
    {
      id: "config",
      code: "const step = 2; const label = 'doubled'",
      dependencies: [],
    },
    {
      id: "doubled",
      code: "data.nums.map(x => x * config.step)",
      dependencies: ["data", "config"],
    },
    {
      id: "multiline",
      code: `
        // This is still an expression despite comments and whitespace
        data.nums
          .map(x => x * config.step)
          .filter(x => x > 5)
      `,
      dependencies: ["data", "config"],
    },
  ];

  const transformed = await transformer.transform(nodes);
  return transformed;
}

example().then(console.log).catch(console.warn);
