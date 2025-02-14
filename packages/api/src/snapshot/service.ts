import { diff } from "jsondiffpatch";
import { RoomSnapshot } from "@tldraw/sync-core";
import { prisma } from "../db";
import { createHash } from "crypto";

type HashAlgorithm = "sha256" | "sha512" | "md5";
type DigestFormat = "hex" | "base64";

function hashString(
  input: string,
  algorithm: HashAlgorithm = "sha256",
  encoding: DigestFormat = "hex",
): string {
  return createHash(algorithm).update(input).digest(encoding);
}

export async function updateSnapshot({
  id,
  snapshot,
}: {
  id: string;
  snapshot: RoomSnapshot;
}) {
  return prisma.$transaction(async () => {
    const { currentSnapshot } = await prisma.canvas.findFirstOrThrow({
      where: { id },
      select: { currentSnapshot: true },
    });

    const diffResult = diff(currentSnapshot || {}, snapshot);

    const snap = {
      canvasId: id,
      patches: diffResult as any,
      clock: snapshot.clock,
      digest: hashString(JSON.stringify(snapshot)),
    };

    await prisma.snapshot.create({
      data: snap,
    });

    await prisma.canvas.update({
      data: { currentSnapshot: snapshot as any, clock: snapshot.clock },
      where: { id },
    });
    return snap;
  });
}
