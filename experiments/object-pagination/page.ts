interface SerializedObjectPreview {
  type: "preview";
  konstructor: string;
  size: number;
  preview: Array<{
    key: string;
    value: string;
    type: string;
  }>;
  hasMore: boolean;
}

class SerializedValue<T extends Object> {
  readonly type: string;
  readonly preview: SerializedObjectPreview | null;
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

  private createPreview(value: any): SerializedObjectPreview | null {
    if (value === null || value === undefined || typeof value !== "object") {
      return null;
    }

    const keys = Object.keys(value);
    const preview = keys.slice(0, 3).map((key) => ({
      key,
      value: this.createValuePreview(value[key]),
      type: this.getValueType(value[key]),
    }));

    return {
      type: "preview",
      konstructor: value.constructor.name,
      size: keys.length,
      preview,
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
    const valueWrapper = new SerializedValue(path, value);
    this.map.set(path, valueWrapper);
    this.capacity--;
    this.nextToken = path;
  }

  toJSON() {
    return {
      items: Array.from(this.map.entries()).map(([path, value]) => ({
        path,
        value,
      })),
      nextToken: this.nextToken,
      hasNextPage: this.hasNextPage,
    };
  }
}
