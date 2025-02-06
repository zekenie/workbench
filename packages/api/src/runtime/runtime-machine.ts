import { CanvasEnvironment } from "@prisma/client";
import { prisma } from "../db";
import { Api } from "../fly/machine-api";
import {
  createApp,
  createMachine,
  createVolume,
  slugifyIdentifier,
  Identifier,
  getMachineInfo,
} from "./create-machine-helpers";
import { publish } from "../lib/pubsub";

const flyApi = new Api({
  baseUrl: Bun.env.FLY_API_URL,
  baseApiParams: {
    headers: {
      authorization: `Bearer ${Bun.env.FLY_API_TOKEN}`,
    },
  },
});

type MachineState =
  | "started"
  | "stopped"
  | "suspended"
  | "destroyed"
  | "starting"
  | "stopping"
  | "suspending";

type FinalState = "started" | "stopped" | "suspended" | "destroyed";

export class RuntimeMachine {
  private envRecordPromise: Promise<CanvasEnvironment> | null = null;

  constructor(public readonly identifier: Identifier) {}

  async getMachineInfo() {
    const env = await this.findEnvRecord();
    return getMachineInfo({
      identifier: this.identifier,
      machineId: env.machineId,
    });
  }

  async url() {
    const env = await this.findEnvRecord();
    return `http://${env.machineId}.${this.appName}.internal`;
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

  async waitForState(state: FinalState) {
    const env = await this.findEnvRecord();
    await flyApi.apps.machinesWait(
      slugifyIdentifier(this.identifier),
      env.machineId,
      {
        state,
      }
    );
  }

  async findEnvRecord(): Promise<CanvasEnvironment> {
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

  async syncMachineState() {
    const env = await this.findEnvRecord();

    const machineInfo = await this.getMachineInfo();

    if (env.state !== machineInfo.state) {
      await prisma.canvasEnvironment.update({
        where: {
          id: env.id,
        },
        data: {
          state: machineInfo.state,
        },
      });

      // this gets cached and we just changed it, so let's invalidate the cache
      this.envRecordPromise = null;

      await publish({
        event: "runtime.state-change",
        canvasId: env.canvasId,
        canvasEnvironmentId: env.id,
        newState: machineInfo.state!,
        prevState: env.state,
      });
    }

    return machineInfo.state;
  }

  get appName() {
    return slugifyIdentifier(this.identifier);
  }

  private async executeStateChange({
    action,
    loadingState,
    finalState,
  }: {
    action: (appId: string, machineId: string) => Promise<any>;
    loadingState: MachineState;
    finalState: FinalState;
  }) {
    const { machineId } = await this.findEnvRecord();
    const appId = slugifyIdentifier(this.identifier);

    await action(appId, machineId);
    const state = await this.syncMachineState();

    if (state !== loadingState) {
      throw new UnexpectedStateError();
    }

    await this.waitForState(finalState);
    await this.syncMachineState();
  }

  async start() {
    await this.executeStateChange({
      action: (appId, machineId) => flyApi.apps.machinesStart(appId, machineId),
      loadingState: "starting",
      finalState: "started",
    });
  }

  async stop() {
    await this.executeStateChange({
      action: (appId, machineId) =>
        flyApi.apps.machinesStop(appId, machineId, { signal: "SIGTERM" }),
      loadingState: "stopping",
      finalState: "stopped",
    });
  }

  async suspend() {
    await this.executeStateChange({
      action: (appId, machineId) =>
        flyApi.apps.machinesSuspend(appId, machineId),
      loadingState: "suspending",
      finalState: "suspended",
    });
  }
}

class UnexpectedStateError extends Error {}
