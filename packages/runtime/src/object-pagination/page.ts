import {
  createStringPreview,
  createDatePreview,
  type Preview,
  PreviewSchema,
} from "./preview";
import { Type, type Static } from "@sinclair/typebox";

export const ObjectKeySchema = Type.Object({
  /**
   * e.g. profile.settings.notifications
   */
  path: Type.String(),
  /**
   * null | string | undefined | date | array | etc. basically `typeof`
   */
  type: Type.String(),
  /**
   * Info needed to represent this object in developer tools style
   */
  preview: PreviewSchema,
});

export const PageJSONSchema = Type.Object({
  items: Type.Array(ObjectKeySchema),
  nextToken: Type.Optional(Type.String()),
  hasNextPage: Type.Boolean(),
});

export type ObjectKey = Static<typeof ObjectKeySchema>;
export type PageJSON = Static<typeof PageJSONSchema>;

class SerializedValue<T extends Object> {
  readonly type: string;
  readonly preview: Preview;
  readonly value: any;

  constructor(
    private readonly path: string,
    private readonly rawValue: T,
  ) {
    this.type = this.getValueType(rawValue);
    this.value = this.serializeValue(rawValue);
    this.preview = this.createPreview(rawValue);
  }

  private getValueType(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (Array.isArray(value)) return "array";
    if (value instanceof Date) return "date";
    if (value instanceof RegExp) return "regexp";
    if (typeof value === "object") return "object";
    return typeof value;
  }

  private serializeValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    // For primitive types, return directly
    if (typeof value !== "object") {
      return value;
    }

    // For complex types, we only return a preview
    return undefined;
  }

  private createPreview(value: any): Preview {
    if (typeof value === "string") {
      return createStringPreview(value);
    }

    if (value instanceof Date) {
      return createDatePreview(value);
    }

    if (typeof value !== "object" || value === null) {
      return value;
    }

    const keys = Object.keys(value);
    const keyPreviews = keys.slice(0, 3).map((key) => ({
      key,
      value: this.createValuePreview(value[key]),
      type: this.getValueType(value[key]),
    }));

    return {
      type: "object",
      constructor: value.constructor.name,
      size: keys.length,
      keyPreviews,
      hasMore: keys.length > 3,
    };
  }

  private createValuePreview(value: any): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string")
      return `"${value.slice(0, 20)}${value.length > 20 ? "..." : ""}"`;
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return `Array(${value.length})`;
      }
      return `${value.constructor.name} {...}`;
    }
    return String(value);
  }
}
export class Page {
  readonly map = new Map<string, SerializedValue<object>>();
  private capacity: number;
  public nextToken?: string;
  public hasNextPage = false;

  hasMore() {
    this.hasNextPage = true;
  }

  constructor(private readonly pageSize: number) {
    this.capacity = pageSize;
  }

  get isFull() {
    return this.capacity <= 0;
  }

  add<T extends Object>(path: string, value: T) {
    if (this.capacity === 0) {
      throw new Error("not added because page is full");
    }
    const valueWrapper = new SerializedValue(path, value);
    this.map.set(path, valueWrapper);
    this.capacity--;
    this.nextToken = path;
  }

  toJSON(): PageJSON {
    return {
      items: Array.from(this.map.entries()).map(([path, value]) => ({
        path,
        type: value.type,
        preview: value.preview,
      })),
      nextToken: this.nextToken,
      hasNextPage: this.hasNextPage,
    };
  }
}
