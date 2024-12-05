import { randomUUIDv7 } from "bun";
import { prisma } from "../db";
import faktory from "faktory-worker";

export async function createCanvas({
  userId,
  title,
  description,
}: {
  userId: string;
  title?: string;
  description?: string;
}) {
  return prisma.$transaction(async () => {
    const canvas = await prisma.canvas.create({
      data: {
        id: randomUUIDv7(),
        title,
        description,
      },
    });
    await prisma.canvasAccess.create({
      data: {
        id: randomUUIDv7(),
        canvasId: canvas.id,
        userId,
      },
    });

    return canvas.id;
  });
}

export async function updateSnapshot({
  id,
  snapshot,
}: {
  id: string;
  snapshot: any;
}) {
  const canvas = await prisma.canvas.findFirstOrThrow({
    where: {
      id: id,
    },
  });

  await prisma.canvas.update({
    data: {
      content: snapshot,
    },
    where: {
      id: canvas.id,
    },
  });

  // should we pool this?
  const fakClient = await faktory.connect();

  await fakClient.job("canvas.compile", { id }).push();
}

export async function findMyCanvas({
  userId,
  canvasId,
}: {
  userId: string;
  canvasId: string;
}) {
  const canvasAccess = await prisma.canvasAccess.findFirstOrThrow({
    where: {
      userId: userId,
      canvasId: canvasId,
    },
    include: {
      canvas: {
        select: {
          id: true,
        },
      },
    },
  });

  const { canvas } = canvasAccess;

  return canvas;
}

export async function countCanvases({ onBehalfOf }: { onBehalfOf: string }) {
  return prisma.canvasAccess.count({
    where: {
      userId: onBehalfOf,
    },
  });
}

export async function listCanvases({
  onBehalfOf,
  skip,
  take,
}: {
  onBehalfOf: string;
  skip?: number;
  take?: number;
}) {
  const accesses = await prisma.canvasAccess.findMany({
    where: {
      userId: onBehalfOf,
    },
    skip,
    take,
    orderBy: {
      canvas: {
        updatedAt: "desc",
      },
    },
    include: {
      canvas: {
        select: {
          id: true,
          title: true,
          titleGenerated: true,
          description: true,
          descriptionGenerated: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return accesses.map((a) => a.canvas);
}
