import { Elysia } from "elysia";
import { findUserById } from "./service";
import { verify } from "./jwt.service";
import { ApiToken, User } from "@prisma/client";
import { prisma } from "../db";
import { errors } from "jose";

export const authMiddleware = new Elysia({ name: "Middleware.Auth" })
  .derive(
    { as: "scoped" },
    async ({
      headers,
    }): Promise<
      | {
          type: "user";
          principal: User;
          failure: null;
        }
      | {
          type: "api";
          principal: ApiToken;
          failure: null;
        }
      | {
          type: "user";
          failure: "token-expired";
          principal: null;
        }
    > => {
      if (headers["x-api-secret"] && headers["x-api-id"]) {
        const apiToken = await prisma.apiToken.findFirstOrThrow({
          where: {
            id: headers["x-api-id"],
          },
        });

        await Bun.password.verify(headers["x-api-secret"], apiToken.tokenHash);

        return {
          type: "api",
          principal: apiToken,
          failure: null,
        };
      }

      const auth = headers["authorization"];
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
      // @ts-expect-error
      if (!token) return { principal: null };

      try {
        const verifiedAndParsedToken = await verify(token);

        const user: User = (await findUserById({
          id: verifiedAndParsedToken.id as string,
        })) as User;

        return { type: "user", principal: user, failure: null };
      } catch (e) {
        if (e instanceof errors.JWTExpired) {
          return { type: "user", principal: null, failure: "token-expired" };
        }
        throw e;
      }
    }
  )
  .macro(({ onBeforeHandle }) => ({
    // This is declaring a service method
    auth(value: "user" | "api" | "unauthenticated" = "unauthenticated") {
      onBeforeHandle(({ principal, error, type, failure }) => {
        switch (value) {
          case "user":
            if (type !== "user") {
              return error(401);
            }
            if (failure && failure === "token-expired") {
              return error(401, { message: "Expired token" });
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
