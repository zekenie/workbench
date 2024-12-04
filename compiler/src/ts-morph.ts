import {
  Project,
  ScriptTarget,
  Node,
  SourceFile,
  Statement,
  ts,
} from "ts-morph";
import { Transpiler } from "bun";

const transpiler = new Transpiler({
  target: "bun",
  loader: "ts",
});

export interface CodeNode {
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

  async transform(nodes: CodeNode[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    for (const node of nodes) {
      try {
        const transformedCode = this.transformNode(node);
        const transpiledCode = await transpiler.transform(transformedCode);

        result[node.id] = transpiledCode;
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
      return this.createEmptyFunction({
        id: node.id,
        dependencies: node.dependencies,
      });
    }

    // Handle declarations
    const declarations = this.findDeclarations(statements);
    if (declarations.length > 0) {
      return this.createFunctionWithDeclarations({
        code: node.code,
        id: node.id,
        declarations,
        dependencies: node.dependencies,
      });
    }

    // Handle expressions and other statements
    return this.createFunctionWithReturnStatement({
      code: node.code,
      id: node.id,
      dependencies: node.dependencies,
      statements,
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

  private createEmptyFunction({
    dependencies,
    id,
  }: {
    dependencies: string[];
    id: string;
  }): string {
    const params = dependencies.join(", ");
    return `function ${id}(${params}) {
  
}`;
  }

  private createFunctionWithDeclarations({
    code,
    declarations,
    dependencies,
    id,
  }: {
    code: string;
    declarations: string[];
    id: string;
    dependencies: string[];
  }): string {
    const params = dependencies.join(", ");
    const returnObj = declarations.join(", ");

    // Remove comments and normalize whitespace
    const cleanCode = this.removeComments(code);

    return `function ${id}(${params}) {
  ${cleanCode}
  return { ${returnObj} };
}`;
  }

  private createFunctionWithReturnStatement({
    code,
    id,
    dependencies,
    statements,
  }: {
    code: string;
    id: string;
    dependencies: string[];
    statements: Statement<ts.Statement>[];
  }): string {
    const params = dependencies.join(", ");

    // Remove comments and normalize whitespace
    const cleanCode = this.removeComments(code);

    // Check if the code is a multi-statement block
    if (statements.length > 1) {
      return `function ${id}(${params}) {
  ${cleanCode}
}`;
    }

    const [firstStatement] = statements;

    if (
      statements.length === 1 &&
      firstStatement.getKindName() === "FunctionDeclaration"
    ) {
      return cleanCode;
    }

    return `function ${id}(${params}) {
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
