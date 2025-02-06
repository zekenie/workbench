import { expect, test, describe } from "bun:test";
import createPage from "./serialize-elevated";
import { Page } from "./page";

// Test helpers that make assertions more readable while keeping test stories clear
const helpers = {
  // Get paths in order of traversal
  getOrderedPaths(page: Page): string[] {
    return Array.from(page.map.keys());
  },

  // Get entries in order of traversal
  getOrderedEntries(page: Page): [string, any][] {
    return Array.from(page.map.entries());
  },

  // Create a page and get the last key (useful for pagination tests)
  getLastKeyFromPage(obj: object, pageSize?: number) {
    const page = createPage(obj, undefined, pageSize);
    return Array.from(page.map.keys()).pop();
  },

  // Assertions that make the test intent clearer
  expectPathsInOrder(paths: string[], expectedPaths: string[]) {
    expectedPaths.forEach((path, index) => {
      expect(paths[index]).toBe(path);
    });
  },

  expectAllPathsPresent(paths: string[], expectedPaths: string[]) {
    expectedPaths.forEach((path) => {
      expect(paths).toContain(path);
    });
  },
};

describe("breadth-first object pagination", () => {
  test("should handle empty object", () => {
    const page = createPage({});
    expect(page).toBeDefined();
    expect(page.isFull).toBe(false);
  });

  test("should handle flat object with default page size", () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    };

    const page = createPage(obj);
    const paths = helpers.getOrderedPaths(page);

    helpers.expectPathsInOrder(paths, ["a", "b", "c", "d"]);
    expect(page.isFull).toBe(false);
  });

  test("should handle nested objects with breadth-first traversal", () => {
    const obj = {
      a: {
        a1: 1,
        a2: 2,
      },
      b: {
        b1: 3,
        b2: 4,
      },
    };

    const page = createPage(obj);
    const paths = helpers.getOrderedPaths(page);

    // Shows the breadth-first order clearly
    helpers.expectPathsInOrder(paths, [
      "a",
      "b",
      "a.a1",
      "a.a2",
      "b.b1",
      "b.b2",
    ]);
  });

  test("should respect page size", () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
    };

    const pageSize = 3;
    const page = createPage(obj, undefined, pageSize);
    const paths = helpers.getOrderedPaths(page);

    expect(paths.length).toBe(pageSize);
    expect(page.isFull).toBe(true);
    helpers.expectPathsInOrder(paths, ["a", "b", "c"]);
  });

  test("should handle deeply nested objects", () => {
    const obj = {
      a: {
        a1: {
          a11: {
            a111: 1,
          },
        },
      },
      b: 2,
    };

    const page = createPage(obj);
    const paths = helpers.getOrderedPaths(page);

    helpers.expectAllPathsPresent(paths, [
      "a",
      "b",
      "a.a1",
      "a.a1.a11",
      "a.a1.a11.a111",
    ]);
  });

  test("should handle arrays in objects", () => {
    const obj = {
      a: [1, 2, 3],
      b: {
        b1: [
          4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8,
          9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7,
          8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6,
          7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5,
          6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4,
          5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9,
          4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 8, 9, 4, 5, 6,
          7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 4, 5,
        ],
      },
    };

    expect(obj.b.b1).toHaveLength(184);

    const page = createPage(obj);
    const paths = helpers.getOrderedPaths(page);

    expect(paths).toHaveLength(100);

    helpers.expectPathsInOrder(paths, ["a", "b", "a.0", "a.1", "a.2", "b.b1"]);
  });

  test("should return empty page for non-existent cursor", () => {
    const obj = {
      a: 1,
      b: 2,
    };

    const page = createPage(obj, "nonexistent");
    const paths = helpers.getOrderedPaths(page);

    expect(paths.length).toBe(0);
    expect(page.isFull).toBe(false);
  });

  test("should handle circular references gracefully", () => {
    const obj: any = {
      a: 1,
    };
    obj.circular = obj;

    const page = createPage(obj);
    expect(page).toBeDefined();
    expect(() => helpers.getOrderedEntries(page)).not.toThrow();
  });

  test("SerializedValue should capture constructor and keys", () => {
    class TestClass {
      prop1 = 1;
      prop2 = 2;
    }

    const obj = {
      test: new TestClass(),
    };

    const page = createPage(obj);
    const serializedValue = page.map.get("test");

    expect(serializedValue?.konstructor).toBe("TestClass");
    expect(serializedValue?.numKeys).toBe(2);
    expect(serializedValue?.keysPreview).toEqual(["prop1", "prop2"]);
  });

  test("should handle all primitive types", () => {
    const obj = {
      string: "test",
      number: 42,
      boolean: true,
      null: null,
      undefined: undefined,
      symbol: Symbol("test"),
    };

    const page = createPage(obj);
    const paths = helpers.getOrderedPaths(page);

    expect(paths.length).toBe(6);
    helpers.expectAllPathsPresent(paths, [
      "string",
      "number",
      "boolean",
      "null",
      "undefined",
      "symbol",
    ]);
  });
});

describe("cursor behavior", () => {
  test("should start from the correct position after cursor", () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
    };

    // Get page starting after 'b'
    const page = createPage(obj, "b", 2);
    const paths = helpers.getOrderedPaths(page);

    helpers.expectPathsInOrder(paths, ["c", "d"]);
    expect(page.nextToken).toBe("d");
    expect(page.hasNextPage).toBe(true);
  });

  test("should skip prior nested keys when using cursor", () => {
    const obj = {
      a: { a1: 1, a2: 2 },
      b: { b1: 3, b2: 4 },
      c: { c1: 5, c2: 6 },
    };

    // Get page starting after 'a.a2'
    const page = createPage(obj, "a.a2", 4);
    const paths = helpers.getOrderedPaths(page);

    // Should skip a, a.a1, and a.a2
    helpers.expectPathsInOrder(paths, ["b.b1", "b.b2", "c.c1", "c.c2"]);
  });

  test("should handle cursor at end of a nesting level", () => {
    const obj = {
      a: { a1: 1, a2: 2 },
      b: { b1: 3, b2: 4 },
    };

    // Get page starting after last property of first nested object
    const page = createPage(obj, "a.a2", 2);
    const paths = helpers.getOrderedPaths(page);

    helpers.expectPathsInOrder(paths, ["b.b1", "b.b2"]);
  });

  test("should correctly state when there are more keys", () => {
    const obj = {
      a: { a1: 1, a2: 2 },
      b: { b1: 3, b2: 4 },
    };

    // Get page starting after last property of first nested object
    const page = createPage(obj, "a", 2);

    expect(page.hasNextPage).toBeTrue();
  });

  test("should correctly state when there are NOT more keys", () => {
    const obj = {
      a: { a1: 1, a2: 2 },
      b: { b1: 3, b2: 4 },
    };

    // Get page starting after last property of first nested object
    const page = createPage(obj, "a.a2", 2);

    expect(page.hasNextPage).toBeFalse();
  });

  test("should maintain breadth-first order after cursor", () => {
    const obj = {
      a: { a1: { deep: 1 } },
      b: { b1: 2 },
      c: { c1: 3 },
    };

    // Start after first top-level key
    const page = createPage(obj, "a", 4);
    const paths = helpers.getOrderedPaths(page);

    // Should get remaining top-level keys before nested ones
    helpers.expectPathsInOrder(paths, ["b", "c", "a.a1", "b.b1"]);
  });

  test("should handle cursor within array indices", () => {
    const obj = {
      arr: [1, 2, 3, 4, 5],
    };

    // Start after second array element
    const page = createPage(obj, "arr.1", 2);
    const paths = helpers.getOrderedPaths(page);

    helpers.expectPathsInOrder(paths, ["arr.2", "arr.3"]);
  });
});
