import { Elysia, t } from "elysia";
import {
  createUser,
  EmailTakenError,
  IncorrectPasswordError,
  UserNotFoundError,
  verifyPassword,
  useRefreshToken,
} from "./service";
import { getJWKS, sign } from "./jwt.service";

const emailPasswordBody = t.Object({
  email: t.String({
    format: "email",
    maxLength: 255,
    minLength: 2,
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
  }),
  password: t.String({
    minLength: 4,
    maxLength: 255,
    writeOnly: true,
  }),
});

export const auth = new Elysia({ prefix: "/auth", tags: ["auth"] })
  .model({
    "auth.jwt": t.Object(
      {
        jwt: t.String({
          minLength: 1,
          description: "JSON Web Token",
        }),
        refreshToken: t.String({
          minLength: 1,
          description: "long lived refresh token",
        }),
      },
      {
        title: "JWT response",
      }
    ),
  })
  .post(
    "/signup",
    async (request) => {
      try {
        const { user, refreshToken } = await createUser({
          email: request.body.email,
          password: request.body.password,
        });

        const jwt = await sign(user.id);

        return { jwt, refreshToken };
      } catch (e) {
        if (e instanceof EmailTakenError) {
          return request.error(401, { message: "Error creating account" });
        }
        throw e;
      }
    },
    {
      body: emailPasswordBody,
      response: { 200: "auth.jwt", 401: t.Object({ message: t.String() }) },
    }
  )
  .post(
    "/refresh",
    async ({ body, error }) => {
      try {
        const { user, newToken } = await useRefreshToken(body.refreshToken);

        if (user) {
          return {
            refreshToken: newToken,
            jwt: await sign(user.id),
          };
        }

        throw new Error("invalid token");
      } catch (e) {
        console.error("err");
        console.error(e);
        return error(401, { message: "invalid or expired refreshTok222en" });
      }
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
      response: { 200: "auth.jwt", 401: t.Object({ message: t.String() }) },
    }
  )
  .get("/jwks", () => {
    return getJWKS();
  })
  .post(
    "/login",
    async (request) => {
      try {
        const { user, refreshToken } = await verifyPassword(request.body);

        const jwt = await sign(user.id);

        return { jwt, refreshToken };
      } catch (e) {
        const possibleLoginErrors = [
          UserNotFoundError,
          IncorrectPasswordError,
        ].map((ec) => ec.name);

        if (possibleLoginErrors.includes((e as Error).constructor.name)) {
          // request.set.status = 401;
          return request.error(401, { message: "Incorrect email or password" });
        }
        throw e;
      }
    },
    {
      body: emailPasswordBody,
      response: { 200: "auth.jwt", 401: t.Object({ message: t.String() }) },
    }
  );

export function getExpirationTime(hoursFromNow: number = 2): number {
  return Math.floor(Date.now() / 1000) + hoursFromNow * 60 * 60;
}
