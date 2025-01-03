import { memoize } from "lodash-es";
import { createClient } from "@redis/client";

/**
 * memoizes redis client by name
 */
export const createRedisClient = memoize(
  (name: string, ...args: Parameters<typeof createClient>) => {
    return createClient(...args);
  }
);
