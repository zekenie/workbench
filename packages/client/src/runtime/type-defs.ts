import * as ts from "typescript";

type NodeState = { [id: string]: string };
type DependencyState = { [id: string]: string[] };

class ExplicitExportDependencyTypeGenerator {
  private program: ts.Program;
  private checker: ts.TypeChecker;
  private processedNodes: Set<string> = new Set();

  constructor(
    private nodeState: NodeState,
    private dependencyState: DependencyState
  ) {
    this.program = this.createProgram();
    this.checker = this.program.getTypeChecker();
  }

  private createProgram(): ts.Program {
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      strict: true,
      noEmit: true,
    };

    const fileMap = this.createFileMap();
    const host = this.createCompilerHost(compilerOptions, fileMap);

    return ts.createProgram(Array.from(fileMap.keys()), compilerOptions, host);
  }

  private createFileMap(): Map<string, ts.SourceFile> {
    return new Map(
      Object.entries(this.nodeState).map(([id, code]) => [
        `${id}.ts`,
        ts.createSourceFile(`${id}.ts`, code, ts.ScriptTarget.ESNext, true),
      ])
    );
  }

  private createCompilerHost(
    compilerOptions: ts.CompilerOptions,
    fileMap: Map<string, ts.SourceFile>
  ): ts.CompilerHost {
    return {
      getSourceFile: (fileName: string) => fileMap.get(fileName),
      getDefaultLibFileName: () => "lib.d.ts",
      writeFile: () => {},
      getCurrentDirectory: () => "/",
      getDirectories: () => [],
      getCanonicalFileName: (fileName: string) => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => "\n",
      fileExists: (fileName: string) => fileMap.has(fileName),
      readFile: (fileName: string) => fileMap.get(fileName)?.text || "",
      resolveModuleNames: (moduleNames: string[], containingFile: string) => {
        return moduleNames.map((moduleName) => {
          if (fileMap.has(`${moduleName}.ts`)) {
            return {
              resolvedFileName: `${moduleName}.ts`,
              isExternalLibraryImport: false,
            };
          }
          return undefined;
        });
      },
      getModuleResolutionCache: () => undefined,
    };
  }

  generateDependencyTypes(nodeId: string): string {
    this.processedNodes.clear();
    let declarationFile = `declare global {\n`;
    declarationFile += this.generateDependencyTypesRecursive(nodeId);
    declarationFile += `}\n\nexport {};\n`;
    return declarationFile;
  }

  private generateDependencyTypesRecursive(nodeId: string): string {
    if (this.processedNodes.has(nodeId)) {
      return "";
    }
    this.processedNodes.add(nodeId);

    const dependencies = this.dependencyState[nodeId] || [];
    let declarationContent = "";

    for (const depId of dependencies) {
      declarationContent += this.generateDependencyTypesRecursive(depId);
    }

    declarationContent += this.generateDeclarationForNode(nodeId, dependencies);

    return declarationContent;
  }

  private generateDeclarationForNode(
    nodeId: string,
    dependencies: string[]
  ): string {
    const sourceFile = this.program.getSourceFile(`${nodeId}.ts`);
    if (!sourceFile) return "";

    const exports = this.getExports(sourceFile);

    let moduleContent = exports
      .map((exp) => {
        if (exp.name === "default") {
          return `    const defaultExport: ${exp.type};\n    export default defaultExport;`;
        } else {
          return `    export const ${exp.name}: ${exp.type};`;
        }
      })
      .join("\n");

    return `
  namespace ${nodeId} {
    ${dependencies
      .map((depId) => `import * as ${depId} from '${depId}';`)
      .join("\n    ")}
    
    ${moduleContent}
  }

  const ${nodeId}: typeof ${nodeId};
  
`;
  }

  private getExports(
    sourceFile: ts.SourceFile
  ): { name: string; type: string }[] {
    const exports: { name: string; type: string }[] = [];

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isExportAssignment(node)) {
        // default export
        const type = this.checker.getTypeAtLocation(node.expression);
        exports.push({
          name: "default",
          type: this.checker.typeToString(type),
        });
      } else if (
        ts.isExportDeclaration(node) &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause)
      ) {
        // named exports
        node.exportClause.elements.forEach((element) => {
          const symbol = this.checker.getSymbolAtLocation(element.name);
          if (symbol) {
            const type = this.checker.getTypeOfSymbolAtLocation(
              symbol,
              element.name
            );
            exports.push({
              name: element.name.text,
              type: this.checker.typeToString(type),
            });
          }
        });
      } else if (
        ts.isVariableStatement(node) &&
        node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        // export const/let/var
        node.declarationList.declarations.forEach((decl) => {
          if (decl.name && ts.isIdentifier(decl.name)) {
            const symbol = this.checker.getSymbolAtLocation(decl.name);
            if (symbol) {
              const type = this.checker.getTypeOfSymbolAtLocation(
                symbol,
                decl.name
              );
              exports.push({
                name: decl.name.text,
                type: this.checker.typeToString(type),
              });
            }
          }
        });
      }
    });

    return exports;
  }
}
