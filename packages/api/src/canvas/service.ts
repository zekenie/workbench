import { randomUUIDv7 } from "bun";
import { prisma } from "../db";
import { publish } from "../lib/pubsub";
import { groupBy } from "lodash-es";

export async function createCanvas({
  userId,
  title,
  description,
}: {
  userId: string;
  title?: string;
  description?: string;
}) {
  const canvasId = await prisma.$transaction(async () => {
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

  await publish({
    event: "canvas.create",
    canvasId,
  });

  return canvasId;
}

export async function hasAccess({
  userId,
  canvasId,
}: {
  userId: string;
  canvasId: string;
}) {
  const access = await prisma.canvasAccess.findFirst({
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

  return !!access;
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

  const canvases = accesses.map((a) => a.canvas);

  const envs = await prisma.canvasEnvironment.findMany({
    where: {
      canvasId: { in: canvases.map((c) => c.id) },
    },
  });

  const envsByCanvasId = groupBy(envs, "canvasId");

  return canvases.map((canvas) => ({
    ...canvas,
    environments: envsByCanvasId[canvas.id] || [],
  }));
}
