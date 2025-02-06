import { get } from "lodash-es";

/**
 * A page of sorts. It's a representation of a slice of an object to be sent over the wire and explored
 * on the client.
 */
class ObjectPage<T> {
  readonly expandable: boolean;
  keys: (keyof T)[];
  capacity = 100;
  expandedKeys = new Map<keyof T, ObjectPage<T[keyof T]>>();

  private expected?: number;
  private readonly konstructor: string;

  get hasRoom() {
    return this.deepKeys.length < this.capacity;
  }

  setExpectedKeys(expected: number) {
    this.expected = expected;
  }

  expand(path: keyof T) {
    this.expandedKeys.set(path, serialize(get(this.original, path))); // this.original[path]
  }

  get firstEmptyPath() {
    return "foo";
    // return this.keys[0];
  }

  private get deepKeys() {
    return [] as string[];
  }

  addKey(key: keyof T) {
    this.keys.push(key);
    this.capacity--;
  }

  constructor(
    private readonly original: T,
    private readonly depth = 1,
  ) {
    // @ts-ignore
    this.konstructor = original.constructor.name;
  }
}

class StringFacade extends ObjectPage<string> {
  expandable = false;
  keys = [] as never[];
}

/**
 * this is seralizing a slize of an object. In many cases it could be the whole thing.
 * `after` is a cursor representing the keys that the consumer already has or doesn't
 * care about. Based on the order that cones back from `Object.keys`
 */
export function serialize<T = any>(obj: T, after?: string) {
  let keys = Object.keys(obj as Object);

  const page = new ObjectPage(obj);

  page.setExpectedKeys(keys.length);
  // breadth first. While the page has more room and there are still keys left
  while (page.hasRoom && keys.length) {
    const [currentKey, ...restOfKeys] = keys;
    page.addKey(currentKey as keyof T);
    keys = restOfKeys;
  }

  // at this point we've gone through all the keys or filled up the page
  // if there's still room
  // `firstEmptyPath` will be null if there is no next path
  while (page.hasRoom && page.firstEmptyPath) {
    page.expand(facade.firstEmptyPath);
  }

  return facade;
}
