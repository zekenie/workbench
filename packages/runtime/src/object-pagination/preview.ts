import { Type, type Static } from "@sinclair/typebox";

export const StringPreviewSchema = Type.Object({
  type: Type.Literal("string"),
  value: Type.String(),
  isTruncated: Type.Boolean(),
  fullLength: Type.Number(),
});

export const DatePreviewSchema = Type.Object({
  type: Type.Literal("date"),
  value: Type.String(),
  timestamp: Type.Number(),
});

export const ObjectKeyPreviewSchema = Type.Object({
  key: Type.String(),
  value: Type.String(),
  type: Type.String(),
});

export const ObjectPreviewSchema = Type.Object({
  type: Type.Literal("object"),
  constructor: Type.String(),
  size: Type.Number(),
  keyPreviews: Type.Array(ObjectKeyPreviewSchema),
  hasMore: Type.Boolean(),
});

export const PreviewSchema = Type.Union([
  StringPreviewSchema,
  DatePreviewSchema,
  ObjectPreviewSchema,
]);

// Derive TypeScript types from schemas
export type StringPreview = Static<typeof StringPreviewSchema>;
export type DatePreview = Static<typeof DatePreviewSchema>;
export type ObjectKeyPreview = Static<typeof ObjectKeyPreviewSchema>;
export type ObjectPreview = Static<typeof ObjectPreviewSchema>;
export type Preview = Static<typeof PreviewSchema>;

export function createStringPreview(str: string): StringPreview {
  const maxLength = 20;
  return {
    type: "string",
    value: str.length > maxLength ? str.slice(0, maxLength) : str,
    isTruncated: str.length > maxLength,
    fullLength: str.length,
  };
}

export function createDatePreview(value: Date): DatePreview {
  return {
    type: "date",
    value: value.toISOString(),
    timestamp: value.getTime(),
  };
}
