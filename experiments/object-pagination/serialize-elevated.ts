import { get } from "lodash-es";
import { breadthFirstKeys, primeUntil } from "./iteration";
import { Page } from "./page";

export default function createPage(obj, after?: string, pageSize = 100) {
  const page = new Page(pageSize);

  const gen = breadthFirstKeys(obj);
  let currentItr;
  if (after) {
    currentItr = primeUntil(gen, after);
    if (!currentItr) {
      // return an empty page.
      return page;
    }
  } else {
    currentItr = gen.next();
  }

  // as long as there's more of the object and there's room left in the page
  while (!currentItr.done) {
    if (page.isFull) {
      page.hasMore();
      break;
    }
    page.add(currentItr.value, get(obj, currentItr.value));
    currentItr = gen.next();
  }

  return page;
}
