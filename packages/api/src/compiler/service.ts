import { CodeNode } from "@prisma/client";
import { prisma } from "../db";

export type CompiledCode = Awaited<ReturnType<typeof getCompiledCode>>;

export async function getCompiledCode({ id }: { id: string }) {
  const latest = await prisma.codeNode.findMany({
    select: {
      compiledCode: true,
      compiledCodeHash: true,
      codeName: true,
      dependencies: true,
    },
    where: {
      canvasId: id,
    },
  });

  return {
    latest,
    codeNames: latest.map((node) => node.codeName),
  };
}

export async function getCompiledCodeDiff({
  original,
  id,
}: {
  original: Pick<CodeNode, "compiledCode" | "compiledCodeHash" | "codeName">[];
  id: string;
}) {
  const { latest, codeNames } = await getCompiledCode({ id });
  const existingHashes = new Set(original.map((node) => node.compiledCodeHash));

  const changed = latest.filter((node) => {
    return !existingHashes.has(node.compiledCodeHash);
  });

  return {
    codeNames,
    changed,
    latest,
  };
}
