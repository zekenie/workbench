import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

interface PromptConfig {
  model?: Anthropic.Model;
  temperature?: number;
  maxTokens?: number;
}

interface Example<I, O> {
  input: I;
  output: O;
  reasoning?: string;
}

interface PromptDefinition<I, O> {
  name: string;
  input: z.ZodType<I>;
  output: z.ZodType<O>;
  examples: Example<I, O>[];
  template: (context: {
    input: I;
    examples: Example<I, O>[];
    formattedExamples: string;
  }) => string;
  config?: PromptConfig;
}

function formatExamples<I, O>(examples: Example<I, O>[]): string {
  return examples
    .map(
      (example) => `
Example:
Input: ${JSON.stringify(example.input, null, 2)}
${example.reasoning ? `Reasoning: ${example.reasoning}\n` : ""}
Output: ${JSON.stringify(example.output, null, 2)}
`,
    )
    .join("\n");
}

export class Prompt<I, O> {
  private anthropic: Anthropic;

  constructor(private definition: PromptDefinition<I, O>) {
    this.anthropic = new Anthropic();
  }

  async execute(input: I): Promise<O> {
    this.definition.input.parse(input);

    const prompt = this.definition.template({
      input,
      examples: this.definition.examples,
      formattedExamples: formatExamples(this.definition.examples),
    });

    const response = await this.anthropic.messages.create({
      model: this.definition.config?.model ?? "claude-3-sonnet-20240229",
      temperature: this.definition.config?.temperature ?? 1,
      max_tokens: this.definition.config?.maxTokens ?? 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const result = this.parseResponse(response);
    return this.definition.output.parse(result);
  }

  configure(config: Partial<PromptConfig>): Prompt<I, O> {
    return new Prompt({
      ...this.definition,
      config: { ...this.definition.config, ...config },
    });
  }

  private parseResponse(response: any): O {
    const text = response.content
      .filter((item: any) => item.type === "text")
      .map((item: any) => item.text)
      .join("\n");

    try {
      return JSON.parse(text);
    } catch {
      return text as O;
    }
  }
}

export type { PromptConfig, Example, PromptDefinition };
