import { describe, test, expect, mock, spyOn, beforeEach } from "bun:test";
import { z } from "zod";
import { Prompt, type PromptDefinition } from "./";
import Anthropic from "@anthropic-ai/sdk";

describe("Prompt", () => {
  let mockCreate: ReturnType<typeof spyOn>;
  let anthropicInstance: Anthropic;

  beforeEach(() => {
    anthropicInstance = new Anthropic({ apiKey: "test" });
    mockCreate = spyOn(anthropicInstance.messages, "create");
    mockCreate.mockImplementation(async () => ({
      content: [{ type: "text", text: "true" }],
    }));

    mock.module("@anthropic-ai/sdk", () => ({
      default: class MockAnthropic {
        messages = anthropicInstance.messages;
      },
    }));
  });

  test("constructor creates instance with default config", () => {
    type SimpleInput = { text: string };
    const definition: PromptDefinition<SimpleInput, boolean> = {
      name: "simple-test",
      input: z.object({ text: z.string() }),
      output: z.boolean(),
      examples: [
        {
          input: { text: "example input" },
          output: true,
          reasoning: "Sample reasoning",
        },
      ],
      template: ({ input }) => `Test prompt with input: ${input.text}`,
    };

    const prompt = new Prompt(definition);
    expect(prompt).toBeDefined();
  });

  test("configure creates new instance with updated config", () => {
    type SimpleInput = { text: string };
    const definition: PromptDefinition<SimpleInput, boolean> = {
      name: "config-test",
      input: z.object({ text: z.string() }),
      output: z.boolean(),
      examples: [],
      template: ({ input }) => `Test: ${input.text}`,
    };

    const prompt = new Prompt(definition);
    const configured = prompt.configure({ temperature: 0.5 });

    expect(configured).toBeInstanceOf(Prompt);
    expect(configured).not.toBe(prompt);
  });

  test("execute validates input with zod schema", async () => {
    type SimpleInput = { text: string };
    const definition: PromptDefinition<SimpleInput, boolean> = {
      name: "validation-test",
      input: z.object({ text: z.string() }),
      output: z.boolean(),
      examples: [],
      template: ({ input }) => `Test: ${input.text}`,
    };

    const prompt = new Prompt(definition);

    // @ts-expect-error - Testing invalid input
    await expect(prompt.execute({ invalid: "input" })).rejects.toThrow();
  });

  test("execute passes formatted examples to template", async () => {
    type SimpleInput = { text: string };
    const definition: PromptDefinition<SimpleInput, boolean> = {
      name: "examples-test",
      input: z.object({ text: z.string() }),
      output: z.boolean(),
      examples: [
        {
          input: { text: "example input" },
          output: true,
          reasoning: "Because it's an example",
        },
      ],
      template: ({ input, examples, formattedExamples }) => `
        Test prompt with input: ${input.text}
        Examples:
        ${formattedExamples}
      `,
    };

    const templateSpy = spyOn(definition, "template");
    const prompt = new Prompt(definition);

    await prompt.execute({ text: "test input" });

    expect(templateSpy).toHaveBeenCalledWith({
      input: { text: "test input" },
      examples: definition.examples,
      formattedExamples: expect.stringContaining("Example:"),
    });
  });

  test("execute calls Anthropic API with correct parameters", async () => {
    type SimpleInput = { text: string };
    const definition: PromptDefinition<SimpleInput, boolean> = {
      name: "api-test",
      input: z.object({ text: z.string() }),
      output: z.boolean(),
      examples: [],
      template: ({ input }) => `Test: ${input.text}`,
    };

    const prompt = new Prompt(definition);
    await prompt.execute({ text: "test input" });

    expect(mockCreate).toHaveBeenCalledWith({
      model: "claude-3-sonnet",
      temperature: 1,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: expect.stringContaining("test input"),
        },
      ],
    });
  });

  test("execute respects custom configuration", async () => {
    type SimpleInput = { text: string };
    const definition: PromptDefinition<SimpleInput, boolean> = {
      name: "custom-config-test",
      input: z.object({ text: z.string() }),
      output: z.boolean(),
      examples: [],
      template: ({ input }) => `Test: ${input.text}`,
    };

    const prompt = new Prompt(definition).configure({
      model: "claude-3-haiku",
      temperature: 0.7,
      maxTokens: 1000,
    });

    await prompt.execute({ text: "test input" });

    expect(mockCreate).toHaveBeenCalledWith({
      model: "claude-3-haiku",
      temperature: 0.7,
      max_tokens: 1000,
      messages: expect.any(Array),
    });
  });

  test("parseResponse handles JSON responses", async () => {
    mockCreate.mockImplementation(async () => ({
      content: [{ type: "text", text: '{"result": true}' }],
    }));

    type SimpleInput = { text: string };
    type JsonOutput = { result: boolean };
    const definition: PromptDefinition<SimpleInput, JsonOutput> = {
      name: "json-test",
      input: z.object({ text: z.string() }),
      output: z.object({ result: z.boolean() }),
      examples: [],
      template: ({ input }) => `Test: ${input.text}`,
    };

    const prompt = new Prompt(definition);
    const result = await prompt.execute({ text: "test" });

    expect(result).toEqual({ result: true });
  });

  test("parseResponse handles text responses", async () => {
    mockCreate.mockImplementation(async () => ({
      content: [{ type: "text", text: "sample response" }],
    }));

    type SimpleInput = { text: string };
    const definition: PromptDefinition<SimpleInput, string> = {
      name: "text-test",
      input: z.object({ text: z.string() }),
      output: z.string(),
      examples: [],
      template: ({ input }) => `Test: ${input.text}`,
    };

    const prompt = new Prompt(definition);
    const result = await prompt.execute({ text: "test" });

    expect(result).toBe("sample response");
  });

  test("formats examples with input, output and reasoning", async () => {
    mockCreate.mockImplementation(async () => ({
      content: [{ type: "text", text: "true" }],
    }));

    type SimpleInput = { text: string };
    const definition: PromptDefinition<SimpleInput, boolean> = {
      name: "format-test",
      input: z.object({ text: z.string() }),
      output: z.boolean(),
      examples: [
        {
          input: { text: "example input" },
          output: true,
          reasoning: "Because it's a test",
        },
      ],
      template: ({ formattedExamples }) => formattedExamples,
    };

    const prompt = new Prompt(definition);
    const spy = spyOn(definition, "template");

    await prompt.execute({ text: "test" });

    const { formattedExamples } = spy.mock.calls[0][0];
    expect(formattedExamples).toContain('"text": "example input"');
    expect(formattedExamples).toContain("true");
    expect(formattedExamples).toContain("Because it's a test");
  });

  test("formats examples correctly without reasoning", async () => {
    mockCreate.mockImplementation(async () => ({
      content: [{ type: "text", text: "true" }],
    }));

    type SimpleInput = { text: string };
    const definition: PromptDefinition<SimpleInput, boolean> = {
      name: "no-reasoning-test",
      input: z.object({ text: z.string() }),
      output: z.boolean(),
      examples: [
        {
          input: { text: "example" },
          output: true,
        },
      ],
      template: ({ formattedExamples }) => formattedExamples,
    };

    const prompt = new Prompt(definition);
    const spy = spyOn(definition, "template");

    await prompt.execute({ text: "test" });

    const { formattedExamples } = spy.mock.calls[0][0];
    expect(formattedExamples).not.toContain("Reasoning:");
    expect(formattedExamples).toContain('"text": "example"');
    expect(formattedExamples).toContain("true");
  });

  test("handles complex nested objects in examples", async () => {
    mockCreate.mockImplementation(async () => ({
      content: [{ type: "text", text: '{"result": "success"}' }],
    }));

    type ComplexInput = {
      nested: Array<{ value: number }>;
    };
    type ComplexOutput = {
      result: string;
    };

    const definition: PromptDefinition<ComplexInput, ComplexOutput> = {
      name: "complex-test",
      input: z.object({
        nested: z.array(z.object({ value: z.number() })),
      }),
      output: z.object({ result: z.string() }),
      examples: [
        {
          input: { nested: [{ value: 1 }, { value: 2 }] },
          output: { result: "success" },
          reasoning: "Complex object test",
        },
      ],
      template: ({ formattedExamples }) => formattedExamples,
    };

    const prompt = new Prompt(definition);
    const spy = spyOn(definition, "template");

    await prompt.execute({ nested: [{ value: 3 }] });

    const { formattedExamples } = spy.mock.calls[0][0];
    expect(formattedExamples).toContain('"value": 1');
    expect(formattedExamples).toContain('"value": 2');
    expect(formattedExamples).toContain('"result": "success"');
  });
});
