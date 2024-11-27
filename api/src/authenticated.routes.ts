import { Elysia, t } from "elysia";
import { findUserById } from "./auth/service";
import { verify } from "./auth/jwt.service";

export const authenticatedRoutes = new Elysia({
  tags: ["Authenticated"],
})
  .derive(async ({ headers }) => {
    console.log("this runs");
    const auth = headers["authorization"];
    const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return { user: null };

    const verifiedAndParsedToken = await verify(token);

    const user = verifiedAndParsedToken
      ? await findUserById({ id: verifiedAndParsedToken.id as string })
      : undefined;

    return { user };
  })
  .guard(
    {
      beforeHandle({ user, set }) {
        // If the user is not authenticated, set the response status to "Unauthorized"
        if (!user) return (set.status = "Unauthorized");
      },
      // headers: t.Object({
      // took this out because it was cumbersome to have everywhere on the client
      // i could inject the value at runtime in one place, but for ts to be happy i needed
      // to satisfy the requirement at every call site which didn't make sense.
      // authorization: t.String({ minLength: 1 }),
      // }),
    },
    (app) => app.get("/hello", () => "hi")
  );
