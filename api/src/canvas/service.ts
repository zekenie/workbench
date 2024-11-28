import { randomUUIDv7 } from "bun";
import { prisma } from "../db";

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