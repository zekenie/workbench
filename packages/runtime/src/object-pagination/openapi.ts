import { PageJSONSchema, ObjectKeySchema } from "./page";
import { Type } from "@sinclair/typebox";
import { PreviewSchema } from "./preview";

/**
 * Returns OpenAPI components that can be merged into a larger OpenAPI spec
 *
 * @example:
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
 *           '200': getPageResponse('Custom description')
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
      Page: Type.Object(PageJSONSchema),
      ObjectKey: Type.Object(ObjectKeySchema),
      Preview: PreviewSchema,
    },
  } as const;
}

/**
 * Returns a reusable OpenAPI response object for the Page
 * @param description Custom description for the response
 * @example:
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
 *           '200': getPageResponse('Custom description')
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
export function getPageResponse(description = "Successful response") {
  return {
    description,
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Page",
        },
      },
    },
  } as const;
}
