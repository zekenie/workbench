import { CodeNode } from "@prisma/client";
import { prisma } from "../db";
import { RoomSnapshot } from "@tldraw/sync-core";
import { Compiler } from "compiler";
import { keyBy } from "lodash-es";

const compiler = new Compiler();

export type CompiledCode = Awaited<ReturnType<typeof getLatestCompiledCode>>;

export async function getLatestCompiledCode({ id }: { id: string }) {
  const nodeIds = await prisma.$queryRaw<{ id: string }[]>`
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (PARTITION BY "codeName" ORDER BY clock DESC) as rn
    FROM "CodeNode"
    WHERE "canvasId" = ${id}
  ) ranked
  WHERE rn = 1
`;

  const latest = await prisma.codeNode.findMany({
    select: {
      compiledCode: true,
      compiledCodeHash: true,
      codeName: true,
      dependencies: true,
    },
    where: {
      canvasId: id,
      id: {
        in: nodeIds.map((row: { id: string }) => row.id),
      },
    },
  });
  return {
    latest,
    codeNames: latest.map((node) => node.codeName),
  };
}

export async function compile({ id }: { id: string }) {
  const { content, clock } = await prisma.snapshot.findFirstOrThrow({
    where: {
      canvasId: id,
    },
    orderBy: {
      clock: "desc",
    },
  });
  const contentTyped = content as unknown as RoomSnapshot;
  const compiled = await compiler.compile(contentTyped);
  await prisma.$transaction(async () => {
    const { latest } = await getLatestCompiledCode({ id });

    const latestByCodeName = keyBy(latest, "codeName");

    const data = await Promise.all(
      compiled.nodes.map(async (node) => ({
        clock,
        canvasId: id,
        codeName: node.id,
        compiledCode: node.compiledCode,
        compiledCodeHash: await node.compiledCodeHash(),
        inputCode: node.inputCode,
        inputCodeHash: await node.inputCodeHash(),
        dependencies: node.dependencies,
        id: crypto.randomUUID(),
      }))
    );

    /**
     * We don't want to insert a new version if the hash and id are the same
     */
    const dedupedData = data.filter(
      (compiledNode) =>
        latestByCodeName[compiledNode.id]?.compiledCodeHash !==
        compiledNode.compiledCodeHash
    );

    await prisma.codeNode.createMany({
      data: dedupedData,
    });
  });
}

export async function getCompiledCodeDiff({
  original,
  id,
}: {
  original: Pick<CodeNode, "compiledCode" | "compiledCodeHash" | "codeName">[];
  id: string;
}) {
  const { latest, codeNames } = await getLatestCompiledCode({ id });
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
