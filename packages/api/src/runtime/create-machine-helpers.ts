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
  return `${i.canvasId}::${i.envType}`;
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

export async function configureEnv({ identifier }: { identifier: Identifier }) {
  const secretString = identifier.canvasId;
  const secretBytes = new TextEncoder().encode(secretString);
  await flyApi.apps.secretCreate(
    slugifyIdentifier(identifier),
    "CANVAS_ID",
    "encrypted",
    {
      value: Array.from(secretBytes),
    }
  );
}

export async function createApp({
  orgSlug,
  identifier,
}: {
  orgSlug: string;
  identifier: Identifier;
}) {
  const slug = slugifyIdentifier(identifier);
  await flyApi.apps.appsCreate({
    org_slug: orgSlug,
    app_name: slug,
  });

  return (await flyApi.apps.appsShow(slug)).data;
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
  });

  return res.data;
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
  const config: FlyMachineConfig = {
    image: Bun.env.FLY_RUNTIME_IMAGE,
    services: [
      {
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

    auto_destroy: true,
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

  const res = await flyApi.apps.machinesCreate(slugifyIdentifier(identifier), {
    region,
    config,
  });

  const machine = res.data;

  return machine;
}
