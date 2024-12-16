import faktory from "faktory-worker";
import { Compiler } from "compiler";
import { prisma } from "../db";
import { RoomSnapshot } from "@tldraw/sync-core";
import pubsub from "../pubsub";

const compiler = new Compiler();

faktory.register("canvas.compile", async (options: any) => {
  const { id } = options;
  const { content } = await prisma.canvas.findFirstOrThrow({
    where: {
      id,
    },
  });
  const contentTyped = content as unknown as RoomSnapshot;
  const compiled = await compiler.compile(contentTyped);
  await prisma.$transaction(async () => {
    await prisma.codeNode.deleteMany({
      where: {
        canvasId: id,
      },
    });

    await prisma.codeNode.createMany({
      data: await Promise.all(
        compiled.nodes.map(async (node) => ({
          canvasId: id,
          codeName: node.id,
          compiledCode: node.compiledCode,
          compiledCodeHash: await node.compiledCodeHash(),
          inputCode: node.inputCode,
          inputCodeHash: await node.inputCodeHash(),
          dependencies: node.dependencies,
          id: crypto.randomUUID(),
        }))
      ),
    });

    await pubsub.publish({
      event: "canvas.compile",
      canvasId: id,
    });
  });
});
