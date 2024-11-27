import { Elysia } from "elysia";
import { findUserById } from "./service";
import { verify } from "./jwt.service";
import { ApiToken, User } from "@prisma/client";
import { prisma } from "../db";

export const authMiddleware = new Elysia({ name: "Middleware.Auth" })
  .derive(
    { as: "scoped" },
    async ({
      headers,
    }): Promise<
      | {
          type: "user";
          principal: User;
        }
      | {
          type: "api";
          principal: ApiToken;
        }
    > => {
      if (headers["x-api-auth"] && headers["x-api-id"]) {
        const apiToken = await prisma.apiToken.findFirstOrThrow({
          where: {
            id: headers["x-api-id"],
          },
        });

        await Bun.password.verify(headers["x-api-auth"], apiToken.tokenHash);

        return {
          type: "api",
          principal: apiToken,
        };
      }

      const auth = headers["authorization"];
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
      // @ts-expect-error
      if (!token) return { principal: null };

      const verifiedAndParsedToken = await verify(token);

      const user: User = (await findUserById({
        id: verifiedAndParsedToken.id as string,
      })) as User;

      return { type: "user", principal: user };
    }
  )
  .macro(({ onBeforeHandle }) => ({
    // This is declaring a service method
    auth(value: "user" | "api" | "unauthenticated" = "unauthenticated") {
      onBeforeHandle(({ principal, error, type }) => {
        switch (value) {
          case "user":
            if (type !== "user") {
              return error(401);
            }
            if (!principal?.id) {
              return error(401);
            }
            break;
          case "api":
            if (type !== "api") {
              return error(401);
            }
            if (!principal?.id) {
              return error(401);
            }
            break;
          case "unauthenticated":
            break;
        }
      });
    },
  }));
