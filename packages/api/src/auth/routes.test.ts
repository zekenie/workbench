import { describe, expect, it } from "bun:test";
import { auth } from "./routes";
import { treaty } from "@elysiajs/eden";
import { prisma } from "../db";
import { createUser } from "./service";

const api = treaty(auth);

describe("auth", () => {
  describe("/signup", () => {
    it("can create a user", async () => {
      const { data } = await api.auth.signup.post({
        email: "oooo@oo.com",
        password: "foobar",
      });

      expect(data).toMatchObject({
        jwt: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it("responds with 401 when email is taken", async () => {
      await prisma.user.create({
        data: {
          email: "zeke@foo.com",
        },
      });

      const { status } = await api.auth.signup.post({
        email: "zeke@foo.com",
        password: "foobar",
      });

      expect(status).toBe(401);
    });
  });

  describe("/login", () => {
    it("gives you a jwt when you have valid credentials", async () => {
      const credentials = {
        email: "foobar@bb.com",
        password: "123456",
      };
      await createUser(credentials);
      const { data } = await api.auth.login.post(credentials);

      expect(data).toMatchObject({
        jwt: expect.any(String),
        refreshToken: expect.any(String),
      });
    });
    it("gives you 401 when you have invalid credentials", async () => {
      const credentials = {
        email: "foobar@bb.com",
        password: "123456",
      };
      const { status } = await api.auth.login.post(credentials);

      expect(status).toBe(401);
    });
  });

  describe("/refresh", () => {
    it("gives back a new jwt and refresh token when a valid jwt is used", async () => {
      const signupRes = await api.auth.signup.post({
        email: "oooo@oo.com",
        password: "foobar",
      });

      const { data } = await api.auth.refresh.post({
        refreshToken: signupRes.data?.refreshToken!,
      });

      expect(data).toMatchObject({
        jwt: expect.any(String),
        refreshToken: expect.any(String),
      });

      expect(data?.jwt).not.toBe(signupRes.data?.jwt);
      expect(data?.refreshToken).not.toBe(signupRes.data?.refreshToken!);
    });

    it("doesn't let you use the same token twice", async () => {
      const signupRes = await api.auth.signup.post({
        email: "oooo@oo.com",
        password: "foobar",
      });

      await api.auth.refresh.post({
        refreshToken: signupRes.data?.refreshToken!,
      });

      const { status } = await api.auth.refresh.post({
        refreshToken: signupRes.data?.refreshToken!,
      });

      expect(status).toBe(401);
    });
  });
});
