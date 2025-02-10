import { expect, test, describe } from "bun:test";
import createPage from "./pagination";
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

  getLastKeyFromPage(page: Page) {
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

describe("createPage", () => {
  test("should handle empty object", () => {
    const page = createPage({
      object: {},
      direction: "wide",
    });
    expect(page).toBeDefined();
    expect(page.isFull).toBe(false);
  });

  describe("breadth first", () => {
    test("should handle flat object with default page size", () => {
      const object = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
      };

      const page = createPage({
        object,
        direction: "wide",
      });
      const paths = helpers.getOrderedPaths(page);

      helpers.expectPathsInOrder(paths, ["a", "b", "c", "d"]);
      expect(page.isFull).toBe(false);
    });

    test("should handle nested objects", () => {
      const object = {
        a: {
          a1: 1,
          a2: 2,
        },
        b: {
          b1: 3,
          b2: 4,
        },
      };

      const page = createPage({
        object,
        direction: "wide",
      });

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
      const object = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
        e: 5,
      };

      const pageSize = 3;
      const page = createPage({
        object,
        pageSize,
        direction: "wide",
      });
      const paths = helpers.getOrderedPaths(page);

      expect(paths.length).toBe(pageSize);
      expect(page.isFull).toBe(true);
      helpers.expectPathsInOrder(paths, ["a", "b", "c"]);
    });

    test("should handle deeply nested objects", () => {
      const object = {
        a: {
          a1: {
            a11: {
              a111: 1,
            },
          },
        },
        b: 2,
      };

      const page = createPage({
        object,
        direction: "wide",
      });

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
      const object = {
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

      expect(object.b.b1).toHaveLength(184);

      const page = createPage({
        object,
        direction: "wide",
      });
      const paths = helpers.getOrderedPaths(page);

      expect(paths).toHaveLength(100);

      helpers.expectPathsInOrder(paths, [
        "a",
        "b",
        "a.0",
        "a.1",
        "a.2",
        "b.b1",
      ]);
    });

    test("should return empty page for non-existent cursor", () => {
      const object = {
        a: 1,
        b: 2,
      };

      const page = createPage({
        object,
        direction: "wide",
        cursor: "nonexistant",
      });

      const paths = helpers.getOrderedPaths(page);

      expect(paths.length).toBe(0);
      expect(page.isFull).toBe(false);
    });

    test("should handle circular references gracefully", () => {
      const object: any = {
        a: 1,
      };
      object.circular = object;

      const page = createPage({
        object,
        direction: "wide",
      });
      expect(page).toBeDefined();
      expect(() => helpers.getOrderedEntries(page)).not.toThrow();
    });

    describe("cursor behavior", () => {
      test("should start from the correct position after cursor", () => {
        const object = {
          a: 1,
          b: 2,
          c: 3,
          d: 4,
          e: 5,
        };

        // Get page starting after 'b'
        const page = createPage({
          cursor: "b",
          pageSize: 2,
          object,
          direction: "wide",
        });
        const paths = helpers.getOrderedPaths(page);

        helpers.expectPathsInOrder(paths, ["c", "d"]);
        expect(page.nextToken).toBe("d");
        expect(page.hasNextPage).toBe(true);
      });

      test("should skip prior nested keys when using cursor", () => {
        const object = {
          a: { a1: 1, a2: 2 },
          b: { b1: 3, b2: 4 },
          c: { c1: 5, c2: 6 },
        };

        // Get page starting after 'a.a2'
        const page = createPage({
          cursor: "a.a2",
          pageSize: 4,
          object,
          direction: "wide",
        });
        const paths = helpers.getOrderedPaths(page);

        // Should skip a, a.a1, and a.a2
        helpers.expectPathsInOrder(paths, ["b.b1", "b.b2", "c.c1", "c.c2"]);
      });

      test("should handle cursor at end of a nesting level", () => {
        const object = {
          a: { a1: 1, a2: 2 },
          b: { b1: 3, b2: 4 },
        };

        // Get page starting after last property of first nested object
        const page = createPage({
          cursor: "a.a2",
          pageSize: 2,
          object,
          direction: "wide",
        });
        const paths = helpers.getOrderedPaths(page);

        helpers.expectPathsInOrder(paths, ["b.b1", "b.b2"]);
      });

      test("should correctly state when there are more keys", () => {
        const object = {
          a: { a1: 1, a2: 2 },
          b: { b1: 3, b2: 4 },
        };

        // Get page starting after last property of first nested object
        const page = createPage({
          cursor: "a",
          pageSize: 2,
          object,
          direction: "wide",
        });

        expect(page.hasNextPage).toBeTrue();
      });

      test("should correctly state when there are NOT more keys", () => {
        const object = {
          a: { a1: 1, a2: 2 },
          b: { b1: 3, b2: 4 },
        };

        // Get page starting after last property of first nested object
        const page = createPage({ object, direction: "wide" });

        expect(page.hasNextPage).toBeFalse();
      });

      test("should maintain breadth-first order after cursor", () => {
        const object = {
          a: { a1: { deep: 1 } },
          b: { b1: 2 },
          c: { c1: 3 },
        };

        // Start after first top-level key
        const page = createPage({
          cursor: "a",
          pageSize: 4,
          object,
          direction: "wide",
        });
        const paths = helpers.getOrderedPaths(page);

        // Should get remaining top-level keys before nested ones
        helpers.expectPathsInOrder(paths, ["b", "c", "a.a1", "b.b1"]);
      });

      test("should handle cursor within array indices", () => {
        const object = {
          arr: [1, 2, 3, 4, 5],
        };

        // Start after second array element
        const page = createPage({
          cursor: "arr.1",
          pageSize: 2,
          object,
          direction: "wide",
        });
        const paths = helpers.getOrderedPaths(page);

        helpers.expectPathsInOrder(paths, ["arr.2", "arr.3"]);
      });
    });
  });

  describe("depth first", () => {
    test("should handle flat object with default page size", () => {
      const object = {
        a: 1,
        b: 2,
        c: 3,
        d: 4,
      };

      const page = createPage({
        object,
        direction: "deep",
      });
      const paths = helpers.getOrderedPaths(page);

      // In flat objects, order should be the same as breadth-first
      helpers.expectPathsInOrder(paths, ["a", "b", "c", "d"]);
      expect(page.isFull).toBe(false);
    });

    test("should handle nested objects", () => {
      const object = {
        a: {
          a1: 1,
          a2: 2,
        },
        b: {
          b1: 3,
          b2: 4,
        },
      };

      const page = createPage({
        object,
        direction: "deep",
      });

      const paths = helpers.getOrderedPaths(page);

      // Shows the depth-first order clearly - complete a branch before moving to b
      helpers.expectPathsInOrder(paths, [
        "a",
        "a.a1",
        "a.a2",
        "b",
        "b.b1",
        "b.b2",
      ]);
    });

    test("should respect page size", () => {
      const object = {
        a: {
          a1: 1,
          a2: 2,
        },
        b: {
          b1: 3,
          b2: 4,
        },
      };

      const pageSize = 3;
      const page = createPage({
        object,
        pageSize,
        direction: "deep",
      });
      const paths = helpers.getOrderedPaths(page);

      expect(paths.length).toBe(pageSize);
      expect(page.isFull).toBe(true);
      // Should get complete first branch until page size limit
      helpers.expectPathsInOrder(paths, ["a", "a.a1", "a.a2"]);
    });

    test("should handle deeply nested objects", () => {
      const object = {
        a: {
          a1: {
            a11: {
              a111: 1,
            },
          },
        },
        b: 2,
      };

      const page = createPage({
        object,
        direction: "deep",
      });

      const paths = helpers.getOrderedPaths(page);

      // Should traverse all the way down before moving to b
      helpers.expectPathsInOrder(paths, [
        "a",
        "a.a1",
        "a.a1.a11",
        "a.a1.a11.a111",
        "b",
      ]);
    });

    test("should handle arrays in objects", () => {
      const object = {
        a: [1, 2, 3],
        b: {
          b1: [4, 5, 6],
        },
      };

      const page = createPage({
        object,
        direction: "deep",
      });
      const paths = helpers.getOrderedPaths(page);

      // Should complete array indices before moving to next branch
      helpers.expectPathsInOrder(paths, [
        "a",
        "a.0",
        "a.1",
        "a.2",
        "b",
        "b.b1",
        "b.b1.0",
        "b.b1.1",
        "b.b1.2",
      ]);
    });

    test("should return empty page for non-existent cursor", () => {
      const object = {
        a: 1,
        b: 2,
      };

      const page = createPage({
        object,
        direction: "deep",
        cursor: "nonexistant",
      });

      const paths = helpers.getOrderedPaths(page);

      expect(paths.length).toBe(0);
      expect(page.isFull).toBe(false);
    });

    test("should handle circular references gracefully", () => {
      const object: any = {
        a: 1,
      };
      object.circular = object;

      const page = createPage({
        object,
        direction: "deep",
      });
      expect(page).toBeDefined();
      expect(() => helpers.getOrderedEntries(page)).not.toThrow();
    });

    describe("cursor behavior", () => {
      test("should start from the correct position after cursor", () => {
        const object = {
          a: {
            a1: 1,
            a2: 2,
          },
          b: {
            b1: 3,
            b2: 4,
          },
        };

        // Get page starting after a.a1
        const page = createPage({
          cursor: "a.a1",
          pageSize: 2,
          object,
          direction: "deep",
        });
        const paths = helpers.getOrderedPaths(page);

        helpers.expectPathsInOrder(paths, ["a.a2", "b"]);
        expect(page.nextToken).toBe("b");
        expect(page.hasNextPage).toBe(true);
      });

      test("should skip prior nested keys when using cursor", () => {
        const object = {
          a: {
            a1: 1,
            a2: {
              a21: 2,
            },
          },
          b: { b1: 3, b2: 4 },
        };

        const page = createPage({
          cursor: "a.a1",
          pageSize: 3,
          object,
          direction: "deep",
        });
        const paths = helpers.getOrderedPaths(page);

        // Should continue with remaining items in current branch
        helpers.expectPathsInOrder(paths, ["a.a2", "a.a2.a21", "b"]);
      });

      test("should handle cursor at end of a nesting level", () => {
        const object = {
          a: { a1: 1, a2: 2 },
          b: { b1: 3, b2: 4 },
        };

        const page = createPage({
          cursor: "a.a2",
          pageSize: 3,
          object,
          direction: "deep",
        });
        const paths = helpers.getOrderedPaths(page);

        // Should move to next branch
        helpers.expectPathsInOrder(paths, ["b", "b.b1", "b.b2"]);
      });

      test("should correctly state when there are more keys", () => {
        const object = {
          a: { a1: 1, a2: 2 },
          b: { b1: 3, b2: 4 },
        };

        const page = createPage({
          cursor: "a.a1",
          pageSize: 2,
          object,
          direction: "deep",
        });

        expect(page.hasNextPage).toBeTrue();
      });

      test("should correctly state when there are NOT more keys", () => {
        const object = {
          a: { a1: 1, a2: 2 },
          b: { b1: 3, b2: 4 },
        };

        const page = createPage({
          object,
          direction: "deep",
        });

        expect(page.hasNextPage).toBeFalse();
      });

      test("should maintain depth-first order after cursor", () => {
        const object = {
          a: {
            a1: { deep: 1 },
            a2: 2,
          },
          b: { b1: 3 },
        };

        const page = createPage({
          cursor: "a.a1",
          pageSize: 3,
          object,
          direction: "deep",
        });
        const paths = helpers.getOrderedPaths(page);

        // Should complete current branch before moving to next
        helpers.expectPathsInOrder(paths, ["a.a1.deep", "a.a2", "b"]);
      });

      test("should handle cursor within array indices", () => {
        const object = {
          arr: [1, 2, 3, 4, 5],
          next: "value",
        };

        const page = createPage({
          cursor: "arr.1",
          pageSize: 3,
          object,
          direction: "deep",
        });
        const paths = helpers.getOrderedPaths(page);

        // Should complete array traversal before moving to next key
        helpers.expectPathsInOrder(paths, ["arr.2", "arr.3", "arr.4"]);
      });
    });
  });
});
