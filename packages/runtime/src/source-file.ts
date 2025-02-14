import type { RoomSnapshot } from "@tldraw/sync-core";
import { patch, type Delta } from "jsondiffpatch";

const defaultDocument = { clock: 0, documents: [] as never[] } as const;

async function hashString(str: string, algorithm = "SHA-256") {
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const data = encoder.encode(str);

  // Generate hash using Web Crypto
  const hashBuffer = await crypto.subtle.digest(algorithm, data);

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

type Config = {
  path: string;
};

export class SourceFile {
  private _snapshot?: RoomSnapshot;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  get snapshot(): Readonly<RoomSnapshot> {
    return (this._snapshot || { ...defaultDocument }) as RoomSnapshot;
  }

  get json() {
    return JSON.stringify(this._snapshot);
  }

  get hash() {
    return hashString(this.json);
  }

  private get file() {
    return Bun.file(this.config.path);
  }

  async load() {
    if (this._snapshot) {
      throw new Error("can only load from file once");
    }
    const exists = await this.file.exists();
    if (!exists) {
      this._snapshot = { ...defaultDocument } as RoomSnapshot;
      await this.save();
    } else {
      this._snapshot = await this.file.json();
    }
  }

  save = async () => {
    await Bun.write(this.file, this.json);
  };

  patch(delta: Delta) {
    this._snapshot = patch(this._snapshot, delta) as RoomSnapshot;
  }
}
