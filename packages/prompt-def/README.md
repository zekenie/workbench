# `prompt-def

A lightweight wrapper around Anthropic's Claude API for managing prompts with examples.

## What it does

- Provides type-safe prompt definitions with input/output validation
- Handles example formatting and template management
- Makes prompts easily configurable and reusable

## Why use it

Raw LLM prompts can be messy to maintain:
- Examples get scattered across code
- Type safety is hard to enforce
- Template strings become unwieldy
- Configuration requires copying and modifying whole prompts

This package makes prompts:
- Self-contained and organized
- Type-safe with Zod validation
- Easy to modify and configure
- Simple to share and reuse

## Running prompts

The Anthropic client will use your `ANTHROPIC_API_KEY` environment variable automatically.

```bash
# Required
export ANTHROPIC_API_KEY=sk-ant-xxxx...

# Optional - override API URL
export ANTHROPIC_API_URL=https://api.anthropic.com
```

## Usage

Define your prompt:
```typescript
import { Prompt } from 'prompt-def';
import { z } from 'zod';

const sentiment = new Prompt({
  name: 'review-sentiment',
  input: z.object({ text: z.string() }),
  output: z.enum(['positive', 'negative', 'neutral']),
  examples: [{
    input: { text: "Love this product! Works perfectly." },
    output: "positive",
    reasoning: "Enthusiastic praise, no negatives"
  }, {
    input: { text: "Broke after one use. Waste of money." },
    output: "negative",
    reasoning: "Product failure and explicit disappointment"
  }],
  template: ({ input, formattedExamples }) => `
Analyze sentiment: ${input.text}
${formattedExamples}
`
});
```

Use it:
```typescript
// Basic usage
const result = await sentiment.execute({
  text: "It's okay but not amazing."
}); // Returns: "neutral"

// Create variation with different settings
const quickAnalyzer = sentiment.configure({
  temperature: 0.9
});
```
