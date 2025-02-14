import { get } from "lodash-es";
import { breadthFirstKeys, depthFirstKeys, primeUntil } from "./iteration";
import { Page } from "./page";

export default function createPage<T>({
  object,
  cursor,
  direction,
  pageSize = 100,
}: {
  object: T;
  cursor?: string;
  direction: "deep" | "wide";
  pageSize?: number;
}) {
  const page = new Page(pageSize);
  const gen =
    direction === "wide" ? breadthFirstKeys(object) : depthFirstKeys(object);

  let currentItr;

  if (cursor) {
    // lazily iterate through the object until we see the cursor
    currentItr = primeUntil(gen, cursor);
    if (!currentItr) {
      // return an empty page.
      return page;
    }
  } else {
    currentItr = gen.next();
  }

  page.add("", object);

  // as long as there's more of the object and there's room left in the page
  while (!currentItr.done) {
    if (page.isFull) {
      page.hasMore();
      break;
    }
    page.add(currentItr.value, get(object, currentItr.value));
    currentItr = gen.next();
  }

  return page;
}
