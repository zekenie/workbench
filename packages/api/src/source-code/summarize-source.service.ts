import type { RoomSnapshot } from "@tldraw/sync-core";
import { prisma } from "../db";
import { type ide } from "tools";
import { randomUUIDv7 } from "bun";
import { parseHTML } from "linkedom";
import { Prompt } from "prompt-def";
import { z } from "zod";

const summarizeSourcePrompt = new Prompt({
  name: "summarize-source",
  input: z.object({ code: z.string() }),
  output: z.string(),
  examples: [
    {
      input: {
        code: `
interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

class AuthGuard {
  private currentUser: AuthUser | null = null;

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  hasRole(role: string): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.roles.includes(role);
  }

  setUser(user: AuthUser | null): void {
    this.currentUser = user;
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }
}`,
      },
      output: `
<reasoning>
1. Key components:
   - Interface: AuthUser (id, email, roles)
   - Class: AuthGuard (methods: isAuthenticated, hasRole, setUser, getCurrentUser)

2. Overall structure:
   The code defines an AuthUser interface and an AuthGuard class for managing user authentication and authorization.

3. Main components and relationships:
   The AuthGuard class uses the AuthUser interface to manage a current user and provide authentication-related functionality.

4. Potential use cases:
   - Managing user sessions in a web application
   - Controlling access to protected resources based on user roles

5. Title options:
   - User Authentication Guard
   - Auth Session Manager
   - Role-based Auth Handler

6. Description options:
   - Manages user authentication and role-based access control
   - Handles user sessions and role verification for secure applications
   - Provides methods to check authentication status and user roles
</reasoning>
<output>
{
  "title": "User Authentication Guard",
  "description": "Answers auth related questions about a current user object you can set with \`setUser\`."
}
</output>`,
    },
    {
      input: {
        code: `
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      data,
      error: null,
      status: response.status
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Unknown error',
      status: 500
    };
  }
}`,
      },
      output: `
<reasoning>
1. Components:
- Interface ApiResponse<T>: Generic interface for API responses with data, error, and status
- Function fetchData<T>: Generic async function that handles HTTP requests and error handling

2. Categories:
- Data Structures: ApiResponse interface
- Utility Functions: fetchData function
- Main Logic: HTTP fetching and response formatting

3. Entry Point:
- fetchData<T> is the main function

4. Dependencies:
- Uses browser's built-in fetch API
- No external imports required

5. Overall Structure:
- Simple two-part structure with interface definition and implementation function
- Uses TypeScript generics for type safety
- Implements try-catch for error handling

6. Component Relationships:
- fetchData returns objects conforming to ApiResponse interface
- Generic type T flows from function parameter to interface usage

7. Potential Use Cases:
- Making type-safe API calls
- Standardizing API response handling
- Consistent error handling across application
- Frontend data fetching with proper typing
</reasoning>
<output>
{
  "title": "Typed API Fetcher",
  "description": "A wrapper for fetching API data that returns standardized responses with proper error handling and TypeScript generics"
}
</output>`,
    },
    {
      input: {
        code: `interface CartItem {
      id: string;
      name: string;
      price: number;
      quantity: number;
    }

    class ShoppingCart {
      private items: Map<string, CartItem> = new Map();

      addItem(item: Omit<CartItem, 'quantity'>): void {
        const existing = this.items.get(item.id);
        if (existing) {
          this.items.set(item.id, {
            ...existing,
            quantity: existing.quantity + 1
          });
        } else {
          this.items.set(item.id, { ...item, quantity: 1 });
        }
      }

      removeItem(id: string): void {
        this.items.delete(id);
      }

      getTotal(): number {
        let total = 0;
        this.items.forEach(item => {
          total += item.price * item.quantity;
        });
        return total;
      }

      getItems(): CartItem[] {
        return Array.from(this.items.values());
      }
    }`,
      },
      output: `
<reasoning>
1. Components:
- CartItem interface: Defines structure for shopping cart items
- ShoppingCart class: Manages a collection of cart items with core cart operations
- Methods: addItem, removeItem, getTotal, getItems

2. Categories:
Data Structures:
- CartItem interface (type definition)
- Map<string, CartItem> (internal storage)
Main Logic:
- ShoppingCart class (core functionality)
Utility Functions:
- getTotal (calculation)
- getItems (data access)

3. Entry Point:
- ShoppingCart class is the main entry point

4. Dependencies:
- No external dependencies or imports

5. Overall Structure:
- Clean, object-oriented design with clear separation of concerns
- Uses TypeScript's type system effectively
- Implements core shopping cart functionality

6. Main Components Relationship:
- CartItem interface defines the structure used by ShoppingCart
- ShoppingCart maintains items using Map for efficient lookups
- Methods operate on the internal Map structure

7. Potential Use Cases:
- E-commerce applications
- Online shopping systems
- Digital cart management
</reasoning>
<output>
{
  "title": "Shopping Cart State",
  "description": "A shopping cart implementation with support for adding/removing items, quantity management, and total calculation using Map."
}
</output>`,
    },
    {
      input: {
        code: `interface ValidationRule {
      test: (value: string) => boolean;
      message: string;
    }

    interface FieldValidation {
      [field: string]: ValidationRule[];
    }

    class FormValidator {
      private rules: FieldValidation;

      constructor(validationRules: FieldValidation) {
        this.rules = validationRules;
      }

      validate(formData: Record<string, string>): Record<string, string[]> {
        const errors: Record<string, string[]> = {};

        Object.keys(this.rules).forEach(field => {
          const fieldValue = formData[field] || '';
          const fieldErrors: string[] = [];

          this.rules[field].forEach(rule => {
            if (!rule.test(fieldValue)) {
              fieldErrors.push(rule.message);
            }
          });

          if (fieldErrors.length > 0) {
            errors[field] = fieldErrors;
          }
        });

        return errors;
      }
    }`,
      },
      output: `
<reasoning>
1. Components:
- \`ValidationRule\` interface: Defines structure for validation rules (test function + message)
- \`FieldValidation\` interface: Maps field names to arrays of validation rules
- \`FormValidator\` class: Main class that handles form validation logic

2. Categories:
Data Structures:
- ValidationRule, FieldValidation interfaces
Main Logic:
- FormValidator class with validate method

3. Entry Point:
- The \`validate\` method in FormValidator class is the main entry point

4. Dependencies:
- No external dependencies, pure TypeScript implementation

5. Overall Structure:
- Clean, object-oriented design with clear separation between rule definition and validation logic

6. Component Relationships:
- ValidationRule defines individual rules
- FieldValidation groups rules by field
- FormValidator uses both to process form data

7. Potential Use Cases:
- Form validation in web applications
- Input validation for user data
- Custom validation rule implementation
- Multi-field validation scenarios
</reasoning>
<output>
{
  "title": "Form Validator",
  "description": "A flexible validation system that processes custom validation rules per field and returns organized error messages for invalid form data."
}
</output>`,
    },
    {
      input: {
        code: `type EventCallback = (...args: any[]) => void;

    class EventBus {
      private events: Map<string, EventCallback[]> = new Map();

      subscribe(event: string, callback: EventCallback): () => void {
        const callbacks = this.events.get(event) || [];
        callbacks.push(callback);
        this.events.set(event, callbacks);

        return () => {
          const callbacks = this.events.get(event) || [];
          this.events.set(
            event,
            callbacks.filter(cb => cb !== callback)
          );
        };
      }

      publish(event: string, ...args: any[]): void {
        const callbacks = this.events.get(event) || [];
        callbacks.forEach(callback => {
          try {
            callback(...args);
          } catch (error) {
            console.error(\`Error in event \${event}:\`, error);
          }
        });
      }

      clear(): void {
        this.events.clear();
      }

      removeEvent(event: string): void {
        this.events.delete(event);
      }
    }`,
      },
      output: `
<reasoning>
1. Components:
  - \`EventCallback\` type: Defines function signature for event handlers
  - \`EventBus\` class: Main event management system
  - \`subscribe\`: Adds event listeners
  - \`publish\`: Triggers events
  - \`clear\`: Removes all events
  - \`removeEvent\`: Removes specific event

2. Categories:
- Data Structures: Map for storing event callbacks
- Core Logic: Event subscription and publishing
- Utility Functions: clear and removeEvent

3. Entry Point:
- \`EventBus\` class is the main entry point
- Used by instantiating new EventBus()

4. Dependencies:
- No external dependencies
- Uses built-in Map and basic TypeScript features

5. Overall Structure:
- Simple pub/sub pattern implementation
- Type-safe event handling system
- Error handling for callback execution

6. Main Components Relationship:
- EventBus manages the relationship between event names and their callbacks
- Subscribers can register and unregister
- Publishers can trigger events

7. Potential Use Cases:
- Component communication in applications
- Decoupled event-driven architectures
- Message bus implementation
- State management systems
</reasoning>
<output>
{
  "title": "Event Bus",
  "description": "A event management system implementing the pub/sub pattern, allowing components to communicate through event registration, publication, and cleanup."
}
</output>`,
    },
  ],
  template: ({ input, formattedExamples }) => `
You are an expert TypeScript developer tasked with generating concise titles and descriptions for TypeScript code snippets.
Your goal is to quickly understand the main functionality of the code and create a clear, informative summary.

Here are some examples of the analysis process and expected output:
${formattedExamples}

Analyze the code and show your work in <reasoning> tags. In your analysis:
1. List out each component (interface, class, function) with a brief description of its purpose
2. Categorize the components by their role (e.g., data structures, utility functions, main logic)
3. Identify the entry point or main function of the code
4. Note any dependencies or imports
5. Describe the overall structure of the code
6. Identify the main components and their relationships
7. Consider potential use cases or problems this code might solve
8. Brainstorm 2-3 options for both the title and description

After completing your analysis, provide your final output in <output> tags using this exact JSON format:
{
  "title": "Concise Title Here (1-4 words)",
  "description": "Brief description of the code's functionality and key features (1-2 sentences)"
}

Remember:
- The title should be 1-4 words
- Titles should not mention technologies like "typescript"
- The description should be 1-2 sentences
- Use backticks (\`) to highlight function names or code snippets in the description if appropriate
- Ensure your description captures the main functionality and purpose of the code

Here is the TypeScript code snippet you need to analyze:
${input.code}
`,
});

interface CodeAnalysis {
  title: string;
  description: string;
}

function parseClaudeOutput(claudeOutput: string) {
  const { document } = parseHTML(claudeOutput);

  return {
    reasoning: document.querySelector("reasoning")?.textContent?.trim() ?? "",
    analysis: JSON.parse(
      document.querySelector("output")?.textContent?.trim() ?? "{}",
    ) as CodeAnalysis,
  };
}

export async function summarizeSource({
  canvasId,
  nodeId,
}: {
  canvasId: string;
  nodeId: string;
}) {
  const { currentSnapshot, clock } = await prisma.canvas.findFirstOrThrow({
    where: { id: canvasId },
    select: { currentSnapshot: true, clock: true },
  });

  const { documents } = currentSnapshot as unknown as RoomSnapshot;
  const node = documents
    .map((doc) => doc.state as ide.IDEShape)
    .find((n) => n.id === nodeId);

  if (!node) {
    throw new Error("no node in doc");
  }

  const output = await summarizeSourcePrompt.execute({
    code: node.props.code,
  });

  const { analysis, reasoning } = parseClaudeOutput(output);

  // do something with it?
  // return await prisma.sourceCodeSummary.create({
  //   data: {
  //     id: randomUUIDv7(),
  //     canvasId,
  //     clock,
  //     nodeId,
  //     title: analysis.title,
  //     summary: analysis.description,
  //     reasoning,
  //   },
  // });
}
