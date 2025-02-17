I need you to generate a title and description for a chunk of typescript code.

Here are some realistic examples:


<examples>


Code:
```typescript
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
}
```
title: User Authentication Guard"
description:Answers auth related questions about a current user object you can set with `setUser`.


---

Code:
```typescript
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
}
```

title: fetchData
description: Takes a URL. Makes a GET request for JSON and gives you back `{ data, error, status }`. 


---

Code:
```typescript
interface CartItem {
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
}
```
Title: Shopping Cart Manager
Description: In-memory tracking of items in a cart and their total. 

---
Code:
```typescript
interface ValidationRule {
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
}
```

Title: Form Validator
Description: Class to maintain form rules and validate form data against them


---
Code:
```typescript
type EventCallback = (...args: any[]) => void;

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
        console.error(`Error in event ${event}:`, error);
      }
    });
  }

  clear(): void {
    this.events.clear();
  }

  removeEvent(event: string): void {
    this.events.delete(event);
  }
}
```
Title: EventBus

Description: Basic in-memory `publish` and `subscribe` implementation.


</examples>

Here's the input code:

import { diff, type ObjectDelta } from "jsondiffpatch";
import { RoomSnapshot } from "@tldraw/sync-core";
import { prisma } from "../db";
import { createHash } from "crypto";
import { pick } from "lodash-es";

type HashAlgorithm = "sha256" | "sha512" | "md5";
type DigestFormat = "hex" | "base64";

function hashString(
  input: string,
  algorithm: HashAlgorithm = "sha256",
  encoding: DigestFormat = "hex",
): string {
  return createHash(algorithm).update(input).digest(encoding);
}

export async function updateSnapshot({
  id,
  snapshot,
}: {
  id: string;
  snapshot: RoomSnapshot;
}): Promise<{
  canvasId: string;
  patches: ObjectDelta;
  clock: number;
  digest: string;
  changedNodes: { id: string; typeName: string; type: string }[];
}> {
  return prisma.$transaction(async () => {
    const { currentSnapshot } = await prisma.canvas.findFirstOrThrow({
      where: { id },
      select: { currentSnapshot: true },
    });

    const diffResult = diff(currentSnapshot || {}, snapshot);
    const changedNodeIndexes: string[] =
      // @ts-ignore
      (Object.keys(diffResult.documents as ObjectDelta) || []).filter((str) =>
        isFinite(+str),
      );

    const changedNodes = changedNodeIndexes.map((idx) => {
      const state = snapshot.documents[+idx].state;
      return {
        id: state.id,
        typeName: state.typeName,
        // @ts-ignore
        type: state.type,
      } as const;
    });

    const snap = {
      canvasId: id,
      patches: diffResult as any,
      clock: snapshot.clock,
      digest: hashString(JSON.stringify(snapshot)),
    };

    await prisma.snapshot.create({
      data: snap,
    });

    await prisma.canvas.update({
      data: { currentSnapshot: snapshot as any, clock: snapshot.clock },
      where: { id },
    });
    return { ...snap, changedNodes };
  });
}


## Formatting rules

- Do not offer any explanation

- Your output will be directly injected into UI