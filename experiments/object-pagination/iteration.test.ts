import { expect, test, describe } from "bun:test";
import { breadthFirstKeys, depthFirstKeys, primeUntil } from "./iteration";

describe("breadthFirstKeys", () => {
  test("should handle empty or invalid inputs", () => {
    const emptyGen = breadthFirstKeys({});
    expect(Array.from(emptyGen)).toEqual([]);

    const nullGen = breadthFirstKeys(null);
    expect(Array.from(nullGen)).toEqual([]);

    const undefinedGen = breadthFirstKeys(undefined);
    expect(Array.from(undefinedGen)).toEqual([]);
  });

  test("should traverse flat object in correct order", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const gen = breadthFirstKeys(obj);

    expect(Array.from(gen)).toEqual(["a", "b", "c"]);
  });

  test("should traverse nested object in breadth-first order", () => {
    const obj = {
      a: { a1: 1, a2: 2 },
      b: { b1: 3 },
    };
    const gen = breadthFirstKeys(obj);

    expect(Array.from(gen)).toEqual(["a", "b", "a.a1", "a.a2", "b.b1"]);
  });

  test("should handle arrays in objects", () => {
    const obj = {
      arr: [1, 2, 3],
      nested: {
        arr: [4, 5],
      },
    };
    const gen = breadthFirstKeys(obj);

    expect(Array.from(gen)).toEqual([
      "arr",
      "nested",
      "arr.0",
      "arr.1",
      "arr.2",
      "nested.arr",
      "nested.arr.0",
      "nested.arr.1",
    ]);
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
    const gen = breadthFirstKeys(obj);

    expect(Array.from(gen)).toEqual([
      "a",
      "b",
      "a.a1",
      "a.a1.a11",
      "a.a1.a11.a111",
    ]);
  });

  test("should handle null and undefined values", () => {
    const obj = {
      a: null,
      b: undefined,
      c: {
        c1: null,
        c2: undefined,
      },
    };
    const gen = breadthFirstKeys(obj);

    expect(Array.from(gen)).toEqual(["a", "b", "c", "c.c1", "c.c2"]);
  });

  test("should handle empty objects and arrays", () => {
    const obj = {
      emptyObj: {},
      emptyArr: [],
      nested: {
        emptyObj: {},
        emptyArr: [],
      },
    };
    const gen = breadthFirstKeys(obj);

    expect(Array.from(gen)).toEqual([
      "emptyObj",
      "emptyArr",
      "nested",
      "nested.emptyObj",
      "nested.emptyArr",
    ]);
  });
});

describe("depthFirstKeys", () => {
  test("should handle empty or invalid inputs", () => {
    const emptyGen = depthFirstKeys({});
    expect(Array.from(emptyGen)).toEqual([]);

    const nullGen = depthFirstKeys(null);
    expect(Array.from(nullGen)).toEqual([]);

    const undefinedGen = depthFirstKeys(undefined);
    expect(Array.from(undefinedGen)).toEqual([]);
  });

  test("should traverse flat object in correct order", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const gen = depthFirstKeys(obj);

    expect(Array.from(gen)).toEqual(["a", "b", "c"]);
  });

  test("should traverse nested object in depth-first order", () => {
    const obj = {
      a: { a1: 1, a2: 2 },
      b: { b1: 3 },
    };
    const gen = depthFirstKeys(obj);

    // In depth-first, we fully explore each branch before moving to siblings
    expect(Array.from(gen)).toEqual(["a", "a.a1", "a.a2", "b", "b.b1"]);
  });

  test("should handle arrays in objects", () => {
    const obj = {
      arr: [1, 2, 3],
      nested: {
        arr: [4, 5],
      },
    };
    const gen = depthFirstKeys(obj);

    expect(Array.from(gen)).toEqual([
      "arr",
      "arr.0",
      "arr.1",
      "arr.2",
      "nested",
      "nested.arr",
      "nested.arr.0",
      "nested.arr.1",
    ]);
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
    const gen = depthFirstKeys(obj);

    // Should go all the way down the first branch before moving to siblings
    expect(Array.from(gen)).toEqual([
      "a",
      "a.a1",
      "a.a1.a11",
      "a.a1.a11.a111",
      "b",
    ]);
  });

  test("should handle null and undefined values", () => {
    const obj = {
      a: null,
      b: undefined,
      c: {
        c1: null,
        c2: undefined,
      },
    };
    const gen = depthFirstKeys(obj);

    expect(Array.from(gen)).toEqual(["a", "b", "c", "c.c1", "c.c2"]);
  });

  test("should handle empty objects and arrays", () => {
    const obj = {
      emptyObj: {},
      emptyArr: [],
      nested: {
        emptyObj: {},
        emptyArr: [],
      },
    };
    const gen = depthFirstKeys(obj);

    expect(Array.from(gen)).toEqual([
      "emptyObj",
      "emptyArr",
      "nested",
      "nested.emptyObj",
      "nested.emptyArr",
    ]);
  });

  test("should handle complex nested structure", () => {
    const obj = {
      a: {
        a1: { deep: { deeper: 1 } },
        a2: 2,
      },
      b: {
        b1: { another: { path: 3 } },
      },
    };
    const gen = depthFirstKeys(obj);

    expect(Array.from(gen)).toEqual([
      "a",
      "a.a1",
      "a.a1.deep",
      "a.a1.deep.deeper",
      "a.a2",
      "b",
      "b.b1",
      "b.b1.another",
      "b.b1.another.path",
    ]);
  });
});

describe("primeUntil", () => {
  test("should return false for empty generator", () => {
    const gen = (function* () {})();
    expect(primeUntil(gen, "any")).toBeUndefined();
  });

  test("should find value and position generator correctly", () => {
    function* testGen() {
      yield "a";
      yield "b";
      yield "c";
      yield "d";
    }

    const gen = testGen();
    const found = primeUntil(gen, "b");

    expect(found).toEqual({ value: "c", done: false });
    // Generator should be positioned after "b"
    expect(gen.next().value).toBe("d");
  });

  test("should return false when value not found", () => {
    function* testGen() {
      yield "a";
      yield "b";
      yield "c";
    }

    const gen = testGen();
    const found = primeUntil(gen, "z");

    expect(found).toBeUndefined();
    // Generator should be exhausted
    expect(gen.next().done).toBe(true);
  });

  test("should work with breadthFirstKeys generator", () => {
    const obj = {
      a: { a1: 1 },
      b: { b1: 2 },
      c: { c1: 3 },
    };

    const gen = breadthFirstKeys(obj);
    const found = primeUntil(gen, "b");

    expect(found).toEqual({ value: "c", done: false });
    // Next value should be "c"
    expect(gen.next().value).toBe("a.a1");
  });
});
