import { Prompt } from "prompt-def";
import { z } from "zod";

const requiresChangePrompt = new Prompt({
  name: "requires-change",

  input: z.object({
    summary: z.string(),
    change: z.string(),
  }),
  output: z.boolean(),

  examples: [
    {
      input: {
        summary:
          "A singleton Logger class that provides configurable log levels and ensures only one instance is created throughout the application.",
        change: `diff
--- original
+++ modified
@@ -1,23 +1,32 @@
 class Logger {
   private static instance: Logger;
   private logLevel: 'info' | 'warn' | 'error' = 'info';
+  private logHistory: string[] = [];
+  private maxLogHistory: number = 100;

   private constructor() {}

   static getInstance(): Logger {
     if (!Logger.instance) {
       Logger.instance = new Logger();
     }
     return Logger.instance;
   }

   setLogLevel(level: 'info' | 'warn' | 'error'): void {
     this.logLevel = level;
   }

   log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
     if (this.shouldLog(level)) {
       console.log(\`[\${level.toUpperCase()}] \${message}\`);
+      this.addToLogHistory(\`[\${level.toUpperCase()}] \${message}\`);
     }
   }

   private shouldLog(level: 'info' | 'warn' | 'error'): boolean {
     const levels = ['info', 'warn', 'error'];
     return levels.indexOf(level) >= levels.indexOf(this.logLevel);
+  }
+
+  getLogHistory(): string[] {
+    return this.logHistory;
+  }
+
+  private addToLogHistory(logEntry: string): void {
+    this.logHistory.push(logEntry);
+    if (this.logHistory.length > this.maxLogHistory) {
+      this.logHistory.shift();
+    }
   }
 }`,
      },
      output: true,
      reasoning:
        "Added significant new functionality with log history tracking and management",
    },
    {
      input: {
        summary:
          "A singleton Logger class that provides configurable log levels and ensures only one instance is created throughout the application.",
        change: `diff
--- original
+++ modified
@@ -1,23 +1,23 @@
 class Logger {
   private static instance: Logger;
-  private logLevel: 'info' | 'warn' | 'error' = 'info';
+  private currentLogLevel: 'info' | 'warn' | 'error' = 'info';

   private constructor() {}

   static getInstance(): Logger {
     if (!Logger.instance) {
       Logger.instance = new Logger();
     }
     return Logger.instance;
   }

   setLogLevel(level: 'info' | 'warn' | 'error'): void {
-    this.logLevel = level;
+    this.currentLogLevel = level;
   }

   log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
     if (this.shouldLog(level)) {
       console.log(\`[\${level.toUpperCase()}] \${message}\`);
     }
   }

   private shouldLog(level: 'info' | 'warn' | 'error'): boolean {
     const levels = ['info', 'warn', 'error'];
-    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
+    return levels.indexOf(level) >= levels.indexOf(this.currentLogLevel);
   }
 }`,
      },
      output: false,
      reasoning: "Simple variable rename that doesn't affect functionality",
    },
    {
      input: {
        summary:
          "Implements the outbox pattern for reliable event processing with transaction-based handling, row-level locking, and automatic retries for failed events.",
        change: `diff
--- original
+++ modified
@@ -1,3 +1,5 @@
 import { setTimeout } from "node:timers/promises";
+import { Logger } from "./lib/logger";
+import { MetricsTracker } from "./lib/metrics";

 import { EventStatus } from "@prisma/client";
@@ -46,6 +48,10 @@
       return events;
     });

+    // Add metrics tracking
+    const metricsTracker = new MetricsTracker();
+    metricsTracker.recordEventProcessing(events.length);
+
     // Publish events outside transaction
     for (const event of events) {
       if (event.retryCount > 4) {
@@ -54,6 +60,8 @@
           where: {
             eventId: event.eventId,
           },
+          // Log failed event details
+          data: { status: EventStatus.FAILED, failedAt: new Date() },
         });
         continue;
       }
@@ -64,6 +72,9 @@
         await prisma.event.update({
           where: { eventId: event.eventId },
           data: {
+            // Track successful event processing timestamp
+            processedAt: new Date(),
             status: EventStatus.PUBLISHED,
           },
         });
@@ -78,6 +89,11 @@
             retryCount: { increment: 1 },
             lastError: (e as Error).message,
+            // Enhanced error tracking
+            lastErrorTimestamp: new Date(),
+            errorDetails: {
+              message: (e as Error).message,
+              stack: (e as Error).stack
+            }
           },
         });
       }`,
      },
      output: true,
      reasoning:
        "Added significant new functionality for metrics tracking and enhanced error handling",
    },
  ],

  template: ({ input, formattedExamples }) => `
You are tasked with determining whether a code change is significant enough to require a new summary. You will be provided with two pieces of information:

1. An existing summary of the code:
<existing_summary>
${input.summary}
</existing_summary>

2. A diff of code change:
<code_change>
${input.change}
</code_change>

Instructions:
1. Carefully read both the existing summary and the code change.
2. Consider whether the code change:
   - Introduces new functionality
   - Removes existing functionality
   - Significantly alters the behavior of the code
   - Changes the overall structure or architecture of the code
   - Impacts the performance or efficiency of the code in a notable way
3. Evaluate if the existing summary still accurately represents the code after this change.

Based on your analysis, decide whether this change is significant enough to require a new summary.

${formattedExamples}

Provide your decision as follows:
- If the change is significant and requires a new summary, output only the word "true" (without quotes).
- If the change is not significant and does not require a new summary, output only the word "false" (without quotes).

Do not provide any explanation or additional text in your output. Your response should consist of a single word: either "true" or "false".`,

  config: {
    model: "claude-3-haiku-20241022",
    temperature: 1,
    maxTokens: 4096,
  },
});

export const isChnageSignificant = async (input: {
  summary: string;
  change: string;
}) => {
  return await requiresChangePrompt.execute(input);
};
