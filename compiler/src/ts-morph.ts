import { Project, ScriptTarget, Node, SourceFile } from "ts-morph";

interface CodeNode {
  id: string;
  code: string;
  dependencies: string[];
}

export class NodeTransformer {
  private project: Project;

  constructor() {
    this.project = new Project({
      compilerOptions: {
        target: ScriptTarget.Latest,
      },
    });
  }

  async transform(nodes: CodeNode[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    for (const node of nodes) {
      try {
        const transformedCode = this.transformNode(node);
        result.set(node.id, transformedCode);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(
            `Failed to transform node ${node.id}: ${error.message}`
          );
        }
        throw error;
      }
    }

    return result;
  }

  private transformNode(node: CodeNode): string {
    const sourceFile = this.createSourceFile(node.code);
    const statements = sourceFile.getStatements();

    if (statements.length === 0) {
      return this.createEmptyFunction(node.dependencies);
    }

    // Handle declarations
    const declarations = this.findDeclarations(statements);
    if (declarations.length > 0) {
      return this.createFunctionWithDeclarations(
        node.code,
        declarations,
        node.dependencies
      );
    }

    // Handle expressions and other statements
    return this.createFunctionWithReturnStatement({
      code: node.code,
      dependencies: node.dependencies,
      statementCount: statements.length,
    });
  }

  private createSourceFile(code: string): SourceFile {
    const tempFileName = `temp${Math.random()}.ts`;
    return this.project.createSourceFile(tempFileName, code, {
      overwrite: true,
    });
  }

  private findDeclarations(statements: Node[]): string[] {
    const declarations: string[] = [];

    statements.forEach((statement) => {
      if (Node.isVariableStatement(statement)) {
        statement
          .getDeclarationList()
          .getDeclarations()
          .forEach((decl) => {
            declarations.push(decl.getName());
          });
      }
    });

    return declarations;
  }

  private createEmptyFunction(dependencies: string[]): string {
    const params = dependencies.join(", ");
    return `function(${params}) {
  
}`;
  }

  private createFunctionWithDeclarations(
    code: string,
    declarations: string[],
    dependencies: string[]
  ): string {
    const params = dependencies.join(", ");
    const returnObj = declarations.join(", ");

    // Remove comments and normalize whitespace
    const cleanCode = this.removeComments(code);

    return `function(${params}) {
  ${cleanCode}
  return { ${returnObj} };
}`;
  }

  private createFunctionWithReturnStatement({
    code,
    dependencies,
    statementCount,
  }: {
    code: string;
    dependencies: string[];
    statementCount: number;
  }): string {
    const params = dependencies.join(", ");

    // Remove comments and normalize whitespace
    const cleanCode = this.removeComments(code);

    // Check if the code is a multi-statement block
    if (statementCount > 1) {
      return `function(${params}) {
  ${cleanCode}
}`;
    }

    return `function(${params}) {
  return ${cleanCode};
}`;
  }

  private removeComments(code: string): string {
    // Remove single-line comments
    code = code.replace(/\/\/.*$/gm, "");

    // Remove multi-line comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, "");

    // Trim whitespace but preserve necessary newlines for multiline expressions
    return code.trim();
  }
}

async function example() {
  const transformer = new NodeTransformer();

  const nodes = [
    {
      id: "data",
      code: "const nums: number[] = [1,2,3]",
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
