import { prisma } from "../db";
import { Api } from "../fly/machine-api";
import {
  createApp,
  createMachine,
  createVolume,
  configureEnv,
  slugifyIdentifier,
  Identifier,
  getMachineInfo,
} from "./create-machine-helpers";

const flyApi = new Api({
  baseUrl: Bun.env.FLY_API_URL,
  baseApiParams: {
    headers: {
      authorization: `Bearer ${Bun.env.FLY_API_TOKEN}`,
    },
  },
});

type EnvRecord = {
  appId: string;
  machineId: string;
};

export class RuntimeMachine {
  private envRecordPromise: Promise<EnvRecord> | null = null;

  constructor(private readonly identifier: Identifier) {}

  async getMachineInfo() {
    const env = await this.findEnvRecord();
    return getMachineInfo({
      identifier: this.identifier,
      machineId: env.machineId,
    });
  }

  static async create({
    canvasId,
    envType,
    region,
  }: {
    canvasId: string;
    envType: string;
    region: string;
  }) {
    const identifier = { canvasId, envType };
    const app = await createApp({
      orgSlug: Bun.env.FLY_ORG_SLUG,
      identifier: identifier,
    });

    await configureEnv({
      identifier: identifier,
    });

    const volume = await createVolume({
      identifier: { canvasId, envType },
      region,
    });

    const machine = await createMachine({
      volumeName: volume.name as string,
      identifier: {
        canvasId,
        envType,
      },
      region,
    });

    await prisma.canvasEnvironment.create({
      data: {
        region,
        appId: app.id!,
        volumeId: volume.id!,
        machineId: machine.id!,
        type: envType,
        canvasId,
      },
    });

    return {
      app,
      volume,
      machine,
      runtimeMachine: new RuntimeMachine(identifier),
    };
  }

  async waitForState(state: "started" | "stopped" | "suspended" | "destroyed") {
    const env = await this.findEnvRecord();
    await flyApi.apps.machinesWait(
      slugifyIdentifier(this.identifier),
      env.machineId,
      {
        state,
      }
    );
  }

  private async findEnvRecord(): Promise<EnvRecord> {
    if (!this.envRecordPromise) {
      this.envRecordPromise = prisma.canvasEnvironment.findFirstOrThrow({
        where: {
          canvasId: this.identifier.canvasId,
          type: this.identifier.envType,
        },
      });
    }
    return this.envRecordPromise;
  }

  async start() {
    const { appId, machineId } = await this.findEnvRecord();
    await flyApi.apps.machinesStart(appId, machineId);
  }

  async stop() {
    const { appId, machineId } = await this.findEnvRecord();
    await flyApi.apps.machinesStop(appId, machineId, {
      signal: "SIGTERM",
    });
  }

  async suspend() {
    const { appId, machineId } = await this.findEnvRecord();
    await flyApi.apps.machinesSuspend(appId, machineId);
  }
}
