import { createClient, fetchExchange } from "@urql/core";

export const client = createClient({
  url: Bun.env.FLY_GRAPHQL_URL,
  exchanges: [fetchExchange],
});
