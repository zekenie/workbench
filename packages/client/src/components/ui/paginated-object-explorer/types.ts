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

// Derive TypeScript types from schemas
export type StringPreview = Static<typeof StringPreviewSchema>;
export type DatePreview = Static<typeof DatePreviewSchema>;
export type ObjectKeyPreview = Static<typeof ObjectKeyPreviewSchema>;
export type ObjectPreview = Static<typeof ObjectPreviewSchema>;
export type Preview = Static<typeof PreviewSchema>;

export type ObjectKey = Static<typeof ObjectKeySchema>;
export type PageJSON = Static<typeof PageJSONSchema>;