import { test, expect, describe } from "bun:test";
import { Page } from "./page";
import { nestPage } from "./nest";

describe("nestPage", () => {
  test("should create a nested structure from flat paths", () => {
    const page = new Page(10);
    page.add("user", { name: "John", age: 30 });
    page.add("user.profile", { email: "john@example.com" });
    page.add("user.profile.settings", { theme: "dark" });

    const nested = nestPage(page);

    expect(nested).toMatchObject({
      children: {
        user: {
          children: {
            profile: {
              children: {
                settings: {
                  children: {},
                  path: "user.profile.settings",
                  type: "object",
                }
              },
              path: "user.profile",
              type: "object",
            }
          },
          path: "user",
          type: "object",
        }
      }
    });
  });

  test("should handle single-level paths", () => {
    const page = new Page(10);
    page.add("name", "John");
    page.add("age", 30);

    const nested = nestPage(page);

    expect(nested).toMatchObject({
      children: {
        name: {
          children: {},
          path: "name",
          type: "string",
        },
        age: {
          children: {},
          path: "age",
          type: "number",
        }
      }
    });
  });

  test("should handle empty page", () => {
    const page = new Page(10);
    const nested = nestPage(page);

    expect(nested).toEqual({
      children: {}
    });
  });

  test("should handle multiple branches", () => {
    const page = new Page(10);
    page.add("users.1.name", "John");
    page.add("users.1.age", 30);
    page.add("users.2.name", "Jane");
    page.add("settings.theme", "dark");

    const nested = nestPage(page);

    expect(nested).toMatchObject({
      children: {
        users: {
          children: {
            "1": {
              children: {
                name: {
                  children: {},
                  path: "users.1.name",
                  type: "string",
                },
                age: {
                  children: {},
                  path: "users.1.age",
                  type: "number",
                }
              }
            },
            "2": {
              children: {
                name: {
                  children: {},
                  path: "users.2.name",
                  type: "string",
                }
              }
            }
          }
        },
        settings: {
          children: {
            theme: {
              children: {},
              path: "settings.theme",
              type: "string",
            }
          }
        }
      }
    });
  });

  test("should preserve all object properties at leaf nodes", () => {
    const page = new Page(10);
    page.add("user.profile", { 
      email: "john@example.com",
      verified: true
    });

    const nested = nestPage(page);
    const profile = nested.children.user.children.profile;

    expect(profile).toHaveProperty("path", "user.profile");
    expect(profile).toHaveProperty("type", "object");
    expect(profile).toHaveProperty("preview");
    expect(profile.preview).toHaveProperty("type", "preview");
  });
});