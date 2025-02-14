import { Type, type Static } from "@sinclair/typebox";
import { PageJSON } from "./types";
import { keyBy } from "lodash-es";

export const SerializedObjectPreviewSchema = Type.Object({
  type: Type.Literal("preview"),
  constructor: Type.String(),
  size: Type.Number(),
  keyPreviews: Type.Array(
    Type.Object({
      key: Type.String(),
      value: Type.String(),
      type: Type.String(),
    }),
  ),
  hasMore: Type.Boolean(),
});

export const NestedObjectKeySchema = Type.Recursive((self) => {
  return Type.Object({
    children: Type.Record(Type.String(), self),
    path: Type.Optional(Type.String()),
    type: Type.Optional(Type.String()),
    preview: Type.Optional(
      Type.Union([SerializedObjectPreviewSchema, Type.Null()]),
    ),
  });
});

export type NestedObjectKey = Static<typeof NestedObjectKeySchema>;

export function nestPage(page: PageJSON): NestedObjectKey {
  const itemsByPath = keyBy(page.items, "path");

  console.log(itemsByPath);

  return page.items.reduce(
    (acc, item) => {
      const path = item.path.split(".");
      const lastSegment = path[path.length - 1];
      let pointer = acc;

      for (const pathSegment of path) {
        const isLastSegment = pathSegment === lastSegment;

        // Create intermediate node if it doesn't exist
        if (!pointer.children[pathSegment]) {
          // @ts-expect-error - eh
          pointer.children[pathSegment] = {
            children: {},
            ...(isLastSegment ? item : {}), // Only add item properties if it's the last segment
          };
        }

        // Move the pointer to the next level
        pointer = pointer.children[pathSegment];
      }

      return acc;
    },
    {
      children: {},
      ...(itemsByPath[""] || {}),
    } as NestedObjectKey,
  );
}
