import faktory from "faktory-worker";
import { RuntimeMachine } from "./runtime-machine";
import { prisma } from "../db";
import { Api } from "../fly/machine-api";
import { setTimeout } from "node:timers/promises";

/**
 * this job's purpose is to poll the fly api and update all our
 * machine's states. these should be kept in sync, but just in case
 * there is some discrepancy w/ reality, this job will catch it.
 */

faktory.register("sync-fly-machines", async (options: any) => {
  for await (const batch of findEnvsInBatches()) {
    for (const env of batch) {
      const machine = new RuntimeMachine({
        canvasId: env.canvasId,
        envType: env.type,
      });

      await machine.syncMachineState();
    }
  }
});

const getMachineCount = async () => {
  return prisma.canvasEnvironment.count();
};

async function* findEnvsInBatches() {
  let count = 0;
  while (count < (await getMachineCount())) {
    const batch = await prisma.canvasEnvironment.findMany({
      take: 500,
      skip: count,
      select: {
        canvasId: true,
        type: true,
      },
    });

    yield batch;

    count += batch.length;
    await setTimeout(50);
  }
}
