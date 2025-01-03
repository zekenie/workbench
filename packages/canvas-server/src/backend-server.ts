// wtf... weird version mismatch issue seemed to be resolved this way?????
import { treaty } from "../../../node_modules/@elysiajs/eden";
import type { App } from "../../api/src/index.process";

export const backendClient = treaty<App>("localhost:3000");

export const createAuthenticatedClient = (id: string, secret: string) =>
  treaty<App>("localhost:3000", {
    headers: {
      "x-api-id": id,
      "x-api-secret": secret,
    },
    // fetcher: (input, init = {}) => {
    //   init.headers = {
    //     ...init.headers,
    //     "x-api-id": id,
    //     "x-api-secret": secret,
    //   };
    //   return fetch(input, init);
    // },
  });

export type ClientType = typeof backendClient;
