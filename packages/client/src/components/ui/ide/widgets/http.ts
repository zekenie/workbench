import yaml from "../languages/yaml";
import { yamlLanguage } from "@codemirror/lang-yaml";
import {
  yamlCompletion,
  yamlSchema,
  yamlSchemaLinter,
} from "codemirror-json-schema/yaml";
import { linter } from "@codemirror/lint";
import { JSONSchema7 } from "json-schema";
import { keymap } from "@codemirror/view";
import { startCompletion, completionKeymap } from "@codemirror/autocomplete";

const jsonSchema: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    url: {
      type: "string",
      format: "uri",
    },
    method: {
      type: "string",
      enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    },
    headers: {
      type: "object",
      patternProperties: {
        "^[A-Za-z0-9-]+$": { type: "string" },
      },
    },
    params: {
      type: "object",
      additionalProperties: {
        type: ["string", "number", "boolean", "null"],
      },
    },
    body: {
      oneOf: [{ type: "string" }, { type: "object" }, { type: "array" }],
    },
    options: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          enum: ["cors", "no-cors", "same-origin", "navigate"],
        },
        cache: {
          type: "string",
          enum: [
            "default",
            "no-store",
            "reload",
            "no-cache",
            "force-cache",
            "only-if-cached",
          ],
        },
        credentials: {
          type: "string",
          enum: ["omit", "same-origin", "include"],
        },
        redirect: {
          type: "string",
          enum: ["follow", "error", "manual"],
        },
        referrerPolicy: {
          type: "string",
          enum: [
            "no-referrer",
            "no-referrer-when-downgrade",
            "origin",
            "origin-when-cross-origin",
            "same-origin",
            "strict-origin",
            "strict-origin-when-cross-origin",
            "unsafe-url",
          ],
        },
        integrity: { type: "string" },
        keepalive: { type: "boolean" },
        signal: { type: "object" },
        timeout: { type: "number", minimum: 0 },
      },
    },
    retryConfig: {
      type: "object",
      properties: {
        retries: { type: "integer", minimum: 0 },
        retryDelay: { type: "number", minimum: 0 },
        retryOn: {
          type: "array",
          items: {
            type: "string",
            enum: ["networkError", "timeout", "5xx"],
          },
        },
      },
    },
  },
  required: ["url", "method"],
  additionalProperties: false,
};

const extensions = ({ dependencies }: { dependencies: string[] }) => {
  return [
    keymap.of([
      {
        key: "Shift-Space",
        run: startCompletion,
      },
      ...completionKeymap,
    ]),
    ...yaml({ dependencies }),
    linter(yamlSchemaLinter(), {
      // the default linting delay is 750ms

      delay: 300,
    }),
    yamlSchema(jsonSchema),
    yamlLanguage.data.of({
      autocomplete: yamlCompletion(),
    }),

    // yamlSchemaHover(),
    // stateExtensions(jsonSchema),
  ];
};

export default extensions;
