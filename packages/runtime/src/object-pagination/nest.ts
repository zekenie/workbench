import { Page } from "./page";
import { Type, type Static } from "@sinclair/typebox";

export const SerializedObjectPreviewSchema = Type.Object({
  type: Type.Literal("preview"),
  constructor: Type.String(),
  size: Type.Number(),
  preview: Type.Array(
    Type.Object({
      key: Type.String(),
      value: Type.String(),
      type: Type.String(),
    }),
  ),
  hasMore: Type.Boolean(),
});

// This needs to be defined using Type.Recursive due to its self-referential nature
export const NestedObjectKeySchema = Type.Recursive((self) =>
  Type.Object({
    children: Type.Record(
      Type.String(),
      Type.Object({
        children: Type.Record(Type.String(), self),
        path: Type.Optional(Type.String()),
        type: Type.Optional(Type.String()),
        preview: Type.Optional(
          Type.Union([SerializedObjectPreviewSchema, Type.Null()]),
        ),
      }),
    ),
  }),
);

export type NestedObjectKey = Static<typeof NestedObjectKeySchema>;

export function nestPage(page: Page) {
  return page.toJSON().items.reduce(
    (acc: NestedObjectKey, item) => {
      const path = item.path.split(".");
      const lastSegment = path[path.length - 1];
      let pointer = acc;

      for (const pathSegment of path) {
        const isLastSegment = pathSegment === lastSegment;

        // Create intermediate node if it doesn't exist
        if (!pointer.children[pathSegment]) {
          // @ts-ignore
          pointer.children[pathSegment] = {
            children: {},
            ...(isLastSegment ? item : {}), // Only add item properties if it's the last segment
          };
        }

        // Move the pointer to the next level
        pointer = pointer.children[pathSegment];
      }

      return acc as NestedObjectKey;
    },
    {
      children: {},
    } as NestedObjectKey,
  );
}
