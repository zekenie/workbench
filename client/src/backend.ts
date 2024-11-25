// wtf... weird version mismatch issue seemed to be resolved this way?????
import { edenTreaty } from "../../server/node_modules/@elysiajs/eden";
import type { App } from "../../server/src/";

export const backendClient = edenTreaty<App>("localhost:3000");

export const createAuthenticatedClient = (jwt: string) =>
  edenTreaty<App>("localhost:3000", {
    fetcher: (input, init = {}) => {
      init.headers = {
        ...init.headers,
        authorization: `Bearer ${jwt}`,
      };
      return fetch(input, init);
    },
  });

export type ClientType = typeof backendClient;
