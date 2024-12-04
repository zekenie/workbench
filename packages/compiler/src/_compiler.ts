import { extractDependencies } from "./dependencies";
import { extractCode } from "./code";
import { snapshot } from "./snapshot";
import { NodeTransformer, type CodeNode } from "./ts-morph";
import { invert } from "lodash-es";

const snapshotDocs = snapshot.documents.map((doc) => doc.state);
const deps = extractDependencies(snapshot);
const code = extractCode(snapshot);

const codeNameToTlDraw = Object.keys(code).reduce(
  (acc, codeName) => {
    // @ts-expect-error
    const doc = snapshotDocs.find((doc) => doc.props?.title === codeName);
    if (!doc) {
      throw new Error(`No document found for code name: ${codeName}`);
    }
    acc[codeName] = doc.id;
    return acc;
  },
  {} as Record<string, string>
);

const tlDrawIdToCodeName = invert(codeNameToTlDraw);

function convertToCodeNameDependencies(
  deps: Record<string, string[]>
): Record<string, string[]> {
  return Object.entries(deps).reduce(
    (acc, [key, dependencies]) => {
      const codeName = tlDrawIdToCodeName[key];
      if (codeName) {
        acc[codeName] = dependencies
          .map((dep) => tlDrawIdToCodeName[dep])
          .filter(Boolean);
      }
      return acc;
    },
    {} as Record<string, string[]>
  );
}

const codeNameDeps = convertToCodeNameDependencies(deps);

const nodes: CodeNode[] = Object.keys(code).map((codeName) => ({
  id: codeName,
  code: code[codeName],
  dependencies:
    deps[codeNameToTlDraw[codeName]]?.map((dep) => tlDrawIdToCodeName[dep]) ||
    [],
}));

const transformer = new NodeTransformer();
console.log(await transformer.transform(nodes));
console.log(codeNameDeps);
