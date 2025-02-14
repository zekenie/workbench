import { test, expect, describe } from "bun:test";
import { nestPage } from "./nest";
import type { PageJSON } from "./types";

describe("nestPage", () => {
  test("should handle basic object nesting", () => {
    const page: PageJSON = {
      items: [
        {
          path: "display_config",
          type: "object",
          preview: {
            type: "object",
            constructor: "Object",
            size: 3,
            keyPreviews: [
              { key: "theme", value: "Object {...}", type: "object" },
              { key: "application_name", value: '"tldraw"', type: "string" },
              { key: "branded", value: "false", type: "boolean" },
            ],
            hasMore: false,
          },
        },
        {
          path: "display_config.theme",
          type: "object",
          preview: {
            type: "object",
            constructor: "Object",
            size: 2,
            keyPreviews: [
              { key: "buttons", value: "Object {...}", type: "object" },
              { key: "general", value: "Object {...}", type: "object" },
            ],
            hasMore: false,
          },
        },
        {
          path: "display_config.theme.buttons",
          type: "object",
          preview: {
            type: "object",
            constructor: "Object",
            size: 2,
            keyPreviews: [
              { key: "font_color", value: '"#ffffff"', type: "string" },
              { key: "font_weight", value: '"600"', type: "string" },
            ],
            hasMore: false,
          },
        },
      ],
      hasNextPage: false,
    };

    const nested = nestPage(page);

    expect(nested).toMatchObject({
      children: {
        display_config: {
          children: {
            theme: {
              children: {
                buttons: {
                  children: {},
                  path: "display_config.theme.buttons",
                  type: "object",
                },
              },
              path: "display_config.theme",
              type: "object",
            },
          },
          path: "display_config",
          type: "object",
        },
      },
    });
  });

  test("should handle arrays with numeric indices", () => {
    const page: PageJSON = {
      items: [
        {
          path: "auth_config.first_factors",
          type: "array",
          preview: {
            type: "object",
            constructor: "Array",
            size: 3,
            keyPreviews: [
              { key: "0", value: '"email_code"', type: "string" },
              { key: "1", value: '"google_one_tap"', type: "string" },
              { key: "2", value: '"oauth_google"', type: "string" },
            ],
            hasMore: false,
          },
        },
        {
          path: "auth_config.first_factors.0",
          type: "string",
          preview: {
            type: "string",
            value: "email_code",
            isTruncated: false,
            fullLength: 10,
          },
        },
        {
          path: "auth_config.first_factors.1",
          type: "string",
          preview: {
            type: "string",
            value: "google_one_tap",
            isTruncated: false,
            fullLength: 14,
          },
        },
      ],
      hasNextPage: false,
    };

    const nested = nestPage(page);

    expect(nested).toMatchObject({
      children: {
        auth_config: {
          children: {
            first_factors: {
              children: {
                "0": {
                  children: {},
                  path: "auth_config.first_factors.0",
                  type: "string",
                },
                "1": {
                  children: {},
                  path: "auth_config.first_factors.1",
                  type: "string",
                },
              },
              path: "auth_config.first_factors",
              type: "array",
            },
          },
        },
      },
    });
  });

  test("should handle nested arrays", () => {
    const page: PageJSON = {
      items: [
        {
          path: "auth_config.identification_requirements",
          type: "array",
          preview: {
            type: "object",
            constructor: "Array",
            size: 2,
            keyPreviews: [
              { key: "0", value: "Array(2)", type: "array" },
              { key: "1", value: "Array(0)", type: "array" },
            ],
            hasMore: false,
          },
        },
        {
          path: "auth_config.identification_requirements.0",
          type: "array",
          preview: {
            type: "object",
            constructor: "Array",
            size: 2,
            keyPreviews: [
              { key: "0", value: '"email_address"', type: "string" },
              { key: "1", value: '"oauth_google"', type: "string" },
            ],
            hasMore: false,
          },
        },
        {
          path: "auth_config.identification_requirements.0.0",
          type: "string",
          preview: {
            type: "string",
            value: "email_address",
            isTruncated: false,
            fullLength: 13,
          },
        },
      ],
      hasNextPage: false,
    };

    const nested = nestPage(page);

    expect(nested).toMatchObject({
      children: {
        auth_config: {
          children: {
            identification_requirements: {
              children: {
                "0": {
                  children: {
                    "0": {
                      children: {},
                      path: "auth_config.identification_requirements.0.0",
                      type: "string",
                    },
                  },
                  path: "auth_config.identification_requirements.0",
                  type: "array",
                },
              },
              path: "auth_config.identification_requirements",
              type: "array",
            },
          },
        },
      },
    });
  });

  test("should preserve all preview properties", () => {
    const page: PageJSON = {
      items: [
        {
          path: "display_config.theme",
          type: "object",
          preview: {
            type: "object",
            constructor: "Object",
            size: 3,
            keyPreviews: [
              { key: "font_color", value: '"#ffffff"', type: "string" },
              {
                key: "font_family",
                value: '"Source Sans Pro"',
                type: "string",
              },
              { key: "font_weight", value: '"600"', type: "string" },
            ],
            hasMore: false,
          },
        },
      ],
      hasNextPage: false,
    };

    const nested = nestPage(page);
    const theme = nested.children.display_config.children.theme;

    expect(theme).toEqual({
      children: {},
      path: "display_config.theme",
      type: "object",
      preview: {
        type: "object",
        constructor: "Object",
        size: 3,
        keyPreviews: [
          { key: "font_color", value: '"#ffffff"', type: "string" },
          { key: "font_family", value: '"Source Sans Pro"', type: "string" },
          { key: "font_weight", value: '"600"', type: "string" },
        ],
        hasMore: false,
      },
    });
  });

  test("should handle empty page", () => {
    const page: PageJSON = {
      items: [],
      hasNextPage: false,
    };

    const nested = nestPage(page);

    expect(nested).toEqual({
      children: {},
    });
  });
});
