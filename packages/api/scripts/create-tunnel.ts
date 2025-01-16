/**
 * this script
 * - creates an ngrok tunnel for your dev machines
 * - creates api keys on your dev machine for a runtime
 * - configures a specified runtime's env w/ your tunnel url and api tokens
 */
import { randomBytes } from "node:crypto";
import { connect } from "@ngrok/ngrok";
import { prisma } from "../src/db";
import { Api } from "../src/fly/machine-api";
import {
  generateConfig,
  Identifier,
  slugifyIdentifier,
} from "../src/runtime/create-machine-helpers";
import { parseArgs } from "util";

/**
 * canvasId + env is the input. with those you can get app name.
 */

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    canvas: {
      type: "string",
    },
    envType: {
      type: "string",
      default: "default",
    },
  },

  strict: true,
  allowPositionals: true,
});

const canvasId = values.canvas!;
const envType = values.envType;

const identifier: Identifier = {
  canvasId,
  envType,
};

const flyApi = new Api({
  baseUrl: Bun.env.FLY_API_URL,

  baseApiParams: {
    headers: {
      authorization: `Bearer ${Bun.env.FLY_API_TOKEN}`,
    },
  },
});

const listener = await connect({
  addr: Bun.env.PORT,
  auth: process.env.NGROK_AUTHTOKEN,
  authtoken: process.env.NGROK_AUTHTOKEN,
});

const token = randomBytes(32).toString("hex");
const { id } = await prisma.apiToken.create({
  data: {
    tokenHash: await Bun.password.hash(token),
  },
});

const env = await prisma.canvasEnvironment.findFirstOrThrow({
  where: {
    canvasId,
    type: envType,
  },
});

const config = generateConfig({
  identifier,
  volumeName: env.volumeId,
});

const res = await flyApi.apps.machinesUpdate(
  slugifyIdentifier(identifier),
  env.machineId,
  {
    config: {
      ...config,
      env: {
        ...(config.env || {}),
        API_DOMAIN: listener.url()!,
        API_ID: id,
        API_SECRET: token,
        CANVAS_ID: canvasId,
      },
    },
  }
);

process.stdin.resume();
