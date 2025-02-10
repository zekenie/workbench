export function* breadthFirstKeys(obj) {
  if (!obj || typeof obj !== "object") return;

  // Keep track of levels to maintain breadth-first order
  let currentLevel = Object.keys(obj).map((key) => ({
    key,
    value: obj[key],
  }));

  let nextLevel: { key: string; value: any }[] = [];

  while (currentLevel.length > 0 || nextLevel.length > 0) {
    // If current level is empty, move to next level
    if (currentLevel.length === 0) {
      currentLevel = nextLevel;
      nextLevel = [];
    }

    const current = currentLevel.shift()!;
    yield current.key;

    if (current.value && typeof current.value === "object") {
      const childKeys = Object.keys(current.value).map((childKey) => ({
        key: `${current.key}.${childKey}`,
        value: current.value[childKey],
      }));
      nextLevel.push(...childKeys);
    }
  }
}

/**
 * "listens" to a generator but throws away values
 * until we get the the value we're looking for
 */
export function primeUntil<T, TReturn, TNext>(
  generator: Generator<T, TReturn, TNext>,
  value: TNext,
) {
  let currentItr = generator.next();
  if (value) {
    while (!currentItr.done) {
      if (value === currentItr.value) {
        currentItr = generator.next();
        return currentItr;
      }
      currentItr = generator.next();
    }
  }
  return;
}

export function* depthFirstKeys(obj) {
  if (!obj || typeof obj !== "object") return;

  // Stack to maintain depth-first order
  const stack = Object.keys(obj)
    .reverse()
    .map((key) => ({
      key,
      value: obj[key],
    }));

  while (stack.length > 0) {
    const current = stack.pop()!;
    yield current.key;

    if (current.value && typeof current.value === "object") {
      const childKeys = Object.keys(current.value)
        .reverse() // Reverse to maintain left-to-right order when using stack
        .map((childKey) => ({
          key: `${current.key}.${childKey}`,
          value: current.value[childKey],
        }));
      stack.push(...childKeys);
    }
  }
}
