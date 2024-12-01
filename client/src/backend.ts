// wtf... weird version mismatch issue seemed to be resolved this way?????
import { JwtPayload } from "jwt-decode";
import {
  edenTreaty,
  edenFetch,
  treaty,
} from "../../api/node_modules/@elysiajs/eden";
import type { App } from "../../api/src/";

export const backendClient = treaty<App>("http://localhost:3000");

export const createAuthenticatedClient = (
  jwt: string,
  jwtDecoded: JwtPayload
) =>
  treaty<App>("http://localhost:3000", {
    // fetcher: (input, init = {}) => {
    //   init.headers = {
    //     ...init.headers,
    //     authorization: `Bearer ${jwt}`,
    //   };
    //   return fetch(input, init);
    // },
    // onRequest(path, req) {
    //   req.headers
    // },
    headers() {
      return {
        authorization: `Bearer ${jwt}`,
      };
    },
  });

export type ClientType = typeof backendClient;

export const createAuthenticatedFetch = (jwt: string) =>
  edenFetch<App>("http://localhost:3000", {
    headers: {
      authorization: `Bearer ${jwt}`,
    },
  });

export const fetchClient = edenFetch<App>("http://localhost:3000");

export type FetchClientType = typeof fetchClient;
