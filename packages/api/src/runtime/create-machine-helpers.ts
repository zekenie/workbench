import { Api, FlyMachineConfig } from "../fly/machine-api";

const flyApi = new Api({
  baseUrl: Bun.env.FLY_API_URL,

  baseApiParams: {
    headers: {
      authorization: `Bearer ${Bun.env.FLY_API_TOKEN}`,
    },
  },
});

export type Identifier = { canvasId: string; envType: string };

export function slugifyIdentifier(i: Identifier) {
  return `${i.canvasId.slice(-5)}${i.envType}`;
}

export async function getMachineInfo({
  identifier,
  machineId,
}: {
  identifier: Identifier;
  machineId: string;
}) {
  const { data } = await flyApi.apps.machinesShow(
    slugifyIdentifier(identifier),
    machineId
  );

  return {
    id: data.id,
    state: data.state,
    region: data.region,
  };
}

export async function createApp({
  orgSlug,
  identifier,
}: {
  orgSlug: string;
  identifier: Identifier;
}) {
  const slug = slugifyIdentifier(identifier);

  const res = await flyApi.apps.appsCreate({
    org_slug: orgSlug,
    app_name: slug,
  });

  return (await flyApi.apps.appsShow(slug, {})).data;
}

export async function createVolume({
  identifier,
  region,
}: {
  identifier: Identifier;
  region: string;
}) {
  const res = await flyApi.apps.volumesCreate(slugifyIdentifier(identifier), {
    region,
    name: slugifyIdentifier(identifier),
    size_gb: 1,
  });

  return res.data;
}
export function generateConfig({
  identifier,
  volumeName,
}: {
  identifier: Identifier;
  volumeName: string;
}) {
  const config: FlyMachineConfig = {
    image: Bun.env.FLY_RUNTIME_IMAGE,
    env: {
      CANVAS_ID: identifier.canvasId,
    },
    services: [
      {
        autostart: true,
        autostop: "suspend",
        ports: [
          {
            port: 80,
            handlers: ["http"],
          },
          {
            port: 443,
            handlers: ["tls", "http"],
            tls_options: {
              default_self_signed: true,
            },
          },
        ],
        protocol: "tcp",
        internal_port: 3001,
      },
    ],
    auto_destroy: false,
    guest: {
      cpu_kind: "shared",
      cpus: 1,
      memory_mb: 256,
    },

    mounts: [
      {
        volume: volumeName,
        path: "/data",
      },
    ],
  };
  return config;
}

export async function createMachine({
  volumeName,
  region,
  identifier,
}: {
  volumeName: string;
  identifier: Identifier;
  region: string;
}) {
  const res = await flyApi.apps.machinesCreate(slugifyIdentifier(identifier), {
    region,
    config: generateConfig({ identifier, volumeName }),
  });

  const machine = res.data;

  return machine;
}
