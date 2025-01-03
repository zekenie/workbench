export async function waitFor(
  fn: () => Promise<boolean>,
  interval: number = 100
) {
  while (true) {
    const conditionMet = await fn();
    if (conditionMet) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
