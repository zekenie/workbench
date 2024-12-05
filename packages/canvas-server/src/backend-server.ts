// wtf... weird version mismatch issue seemed to be resolved this way?????
import { edenTreaty } from "../../api/node_modules/@elysiajs/eden";
import type { App } from "../../api/src/";

export const backendClient = edenTreaty<App>("localhost:3000");

export const createAuthenticatedClient = (id: string, secret: string) =>
  edenTreaty<App>("localhost:3000", {
    fetcher: (input, init = {}) => {
      init.headers = {
        ...init.headers,
        "x-api-id": id,
        "x-api-secret": secret,
      };
      return fetch(input, init);
    },
  });

export type ClientType = typeof backendClient;
