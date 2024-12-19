import { type RoomSnapshot } from "@tldraw/sync-core";
import { extractCode } from "./code";
import { extractDependencies } from "./dependencies";
import { type UnknownRecord } from "@tldraw/tldraw";
import { keyBy, invert } from "lodash-es";
import { type CodeNode, NodeTransformer } from "./ts-morph";

async function hashString(str: string, algorithm = "SHA-256") {
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(str);

  // Generate hash using Web Crypto
  const hashBuffer = await crypto.subtle.digest(algorithm, data);

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

export class CompiledNode {
  private _compiledCodeHash?: string;
  private _inputCodeHash?: string;

  constructor(
    readonly id: string,
    readonly codeName: string,
    readonly inputCode: string,
    readonly compiledCode: string,
    readonly dependencies: string[]
  ) {}

  async inputCodeHash() {
    if (!this._inputCodeHash) {
      this._inputCodeHash = await hashString(this.inputCode);
    }
    return this._inputCodeHash;
  }

  async compiledCodeHash() {
    if (!this._compiledCodeHash) {
      this._compiledCodeHash = await hashString(this.compiledCode);
    }
    return this._compiledCodeHash;
  }
}
export class CompiledCanvas {
  nodes: CompiledNode[] = [];
  public addNode({
    id,
    inputCode,
    compiledCode,
    dependencies,
  }: {
    id: string;
    inputCode: string;
    compiledCode: string;
    dependencies: string[];
  }) {
    this.nodes.push(
      new CompiledNode(id, id, inputCode, compiledCode, dependencies)
    );
    return this;
  }

  [Symbol.iterator]() {
    return this.nodes[Symbol.iterator]();
  }
}

export class Compiler {
  public async compile(snapshot: RoomSnapshot): Promise<CompiledCanvas> {
    const dependencies = extractDependencies(snapshot);
    const code = extractCode(snapshot);

    const codeNameToTlDrawIdMap = this.codeNameToTlDrawId({
      snapshotRecords: snapshot.documents.map((doc) => doc.state),
      codeNames: Object.keys(code),
    });

    const codeNameDependencies =
      this.transformTlDrawDependenciesToCodenameDependencies({
        tldrawDependencies: dependencies,
        codeNameToTlDrawIdMap,
      });

    const nodes: CodeNode[] = Object.keys(code).map((codeName) => ({
      id: codeName,
      code: code[codeName],
      dependencies: codeNameDependencies[codeName] || [],
    }));

    const compiledCode = await new NodeTransformer().transform(nodes);

    const compiledCanvas = new CompiledCanvas();
    for (const node of nodes) {
      compiledCanvas.addNode({
        id: node.id,
        inputCode: node.code,
        dependencies: node.dependencies,
        compiledCode: compiledCode[node.id],
      });
    }

    return compiledCanvas;
  }

  /**
   * takes a dependency graph structure like
   * `{ node1: [node2, node3] }`
   * where all ids are tldraw ids
   *
   * and returns codename graph
   * `{ code1: [code2, code3] }
   */
  private transformTlDrawDependenciesToCodenameDependencies({
    codeNameToTlDrawIdMap,
    tldrawDependencies,
  }: {
    codeNameToTlDrawIdMap: Record<string, string>;
    tldrawDependencies: ReturnType<typeof extractDependencies>;
  }) {
    const tlDrawIdToCodeNameMap = invert(codeNameToTlDrawIdMap);
    return Object.entries(tldrawDependencies).reduce(
      (acc, [key, dependencies]) => {
        const codeName = tlDrawIdToCodeNameMap[key];
        if (codeName) {
          acc[codeName] = dependencies
            .map((dep) => tlDrawIdToCodeNameMap[dep])
            .filter(Boolean);
        }
        return acc;
      },
      {} as Record<string, string[]>
    );
  }

  /**
   * Returns a mapping of the codename ids to the tldraw ids
   */
  private codeNameToTlDrawId({
    snapshotRecords,
    codeNames,
  }: {
    snapshotRecords: UnknownRecord[];
    codeNames: string[];
  }): Record<string, string> {
    const snapshotRecordsByCodename = keyBy(
      // @ts-expect-error
      snapshotRecords.filter((rec) => Boolean(rec.props?.title)),
      // @ts-expect-error
      (rec) => rec.props?.title
    ) as Record<string, UnknownRecord>;
    console.log(codeNames);
    return codeNames.reduce(
      (acc, codeName) => {
        const doc = snapshotRecordsByCodename[codeName];
        if (!doc) {
          throw new Error(`No document found for code name: ${codeName}`);
        }

        acc[codeName] = doc.id;

        return acc;
      },
      {} as Record<string, string>
    );
  }
}
