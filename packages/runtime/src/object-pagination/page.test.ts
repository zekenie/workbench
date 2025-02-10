import { expect, test, describe } from "bun:test";
import { Page } from "./page";

describe("Page", () => {
  test("should create an empty page with specified size", () => {
    const page = new Page(5);
    expect(page.map.size).toBe(0);
    expect(page.toJSON().items).toHaveLength(0);
  });

  test("should add items and track capacity", () => {
    const page = new Page(2);
    
    page.add("test.path1", { name: "John" });
    page.add("test.path2", { age: 30 });
    
    expect(page.isFull).toBe(true);
    expect(page.map.size).toBe(2);
  });

  test("should throw error when adding to full page", () => {
    const page = new Page(1);
    page.add("test.path", { name: "John" });
    
    expect(() => {
      page.add("test.path2", { name: "Jane" });
    }).toThrow("not added because page is full");
  });

  test("should correctly serialize different types of values", () => {
    const page = new Page(5);
    const date = new Date("2024-01-01");
    
    page.add("string.path", "Hello World");
    page.add("number.path", 42);
    page.add("date.path", date);
    page.add("object.path", { a: 1, b: 2, c: 3, d: 4 });
    page.add("array.path", [1, 2, 3]);

    const json = page.toJSON();
    
    // Test string serialization
    expect(json.items[0].type).toBe("string");
    expect(json.items[0].preview.type).toBe("string");
    
    // Test number serialization
    expect(json.items[1].type).toBe("number");
    
    // Test date serialization
    expect(json.items[2].type).toBe("date");
    expect(json.items[2].preview.timestamp).toBe(date.getTime());
    
    // Test object serialization
    expect(json.items[3].type).toBe("object");
    expect(json.items[3].preview.type).toBe("preview");
    expect(json.items[3].preview.hasMore).toBe(true);
    expect(json.items[3].preview.size).toBe(4);
    
    // Test array serialization
    expect(json.items[4].type).toBe("array");
    expect(json.items[4].preview.constructor).toBe("Array");
  });

  test("should handle pagination metadata", () => {
    const page = new Page(2);
    
    page.add("test.path1", { name: "John" });
    page.add("test.path2", { name: "Jane" });
    page.hasMore();

    const json = page.toJSON();
    
    expect(json.nextToken).toBe("test.path2");
    expect(json.hasNextPage).toBe(true);
  });

  test("should create truncated previews for long strings", () => {
    const page = new Page(1);
    const longString = "This is a very long string that should be truncated";
    
    page.add("string.path", longString);
    
    const json = page.toJSON();
    const preview = json.items[0].preview as any;
    
    expect(preview.type).toBe("string");
    expect(preview.isTruncated).toBe(true);
    expect(preview.value.length).toBe(20);
    expect(preview.fullLength).toBe(longString.length);
  });

  test("should handle null and undefined values", () => {
    const page = new Page(2);
    
    page.add("null.path", null);
    page.add("undefined.path", undefined);
    
    const json = page.toJSON();
    
    expect(json.items[0].type).toBe("null");
    expect(json.items[1].type).toBe("undefined");
  });
});