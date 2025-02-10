import { SerializedObjectPreviewSchema, NestedObjectKeySchema } from "./nest";
import { Type } from "@sinclair/typebox";

/**
 * Returns OpenAPI components that can be merged into a larger OpenAPI spec
 *
 * @example:
 *
 * ```typescript
 * const apiSpec = {
 *   openapi: '3.0.0',
 *   info: {
 *     title: 'My API',
 *     version: '1.0.0',
 *   },
 *   paths: {
 *     '/my-endpoint': {
 *       get: {
 *         summary: 'My endpoint',
 *         responses: {
 *           '200': getNestedObjectResponse('Custom description')
 *         }
 *       }
 *     }
 *   },
 *   components: {
 *     ...getOpenAPIComponents()
 *   }
 * }
 * ```
 */
export function getOpenAPIComponents() {
  return {
    schemas: {
      SerializedObjectPreview: Type.Object(SerializedObjectPreviewSchema),
      NestedObjectKey: Type.Object(NestedObjectKeySchema),
    },
  } as const;
}

/**
 * Returns a reusable OpenAPI response object for the nested object
 * @param description Custom description for the response
 * @example:
 *
 * ```typescript
 * const apiSpec = {
 *   openapi: '3.0.0',
 *   info: {
 *     title: 'My API',
 *     version: '1.0.0',
 *   },
 *   paths: {
 *     '/my-endpoint': {
 *       get: {
 *         summary: 'My endpoint',
 *         responses: {
 *           '200': getNestedObjectResponse('Custom description')
 *         }
 *       }
 *     }
 *   },
 *   components: {
 *     ...getOpenAPIComponents()
 *   }
 * }
 * ```
 */
export function getNestedObjectResponse(description = "Successful response") {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/NestedObjectKey",
        },
      },
    },
  } as const;
}
