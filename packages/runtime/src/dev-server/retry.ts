// retry.ts
import type { Harness } from "../harness";

export function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Starts watching for live edits with automatic retry capability using exponential backoff and jitter.
 *
 * Implements a robust retry mechanism that:
 * - Uses exponential backoff to progressively increase delay between retries
 * - Applies random jitter to prevent thundering herd problems
 * - Limits maximum retry attempts to avoid infinite loops
 *
 * Example delays with default settings (excluding jitter):
 * - 1st retry: 1000ms (1s)
 * - 2nd retry: 2000ms (2s)
 * - 3rd retry: 4000ms (4s)
 * - 4th retry: 8000ms (8s)
 * - 5th retry: 16000ms (16s)
 *
 * Each delay includes random jitter of ±30% by default to prevent retry synchronization
 * across multiple clients.
 *
 * @throws {Error} Throws the original error if max retries are exceeded
 */
export async function startAndKeepWatchingLiveEdits({
  harness,
  count = 0,
  baseDelay = 1000,
  maxRetries = 5,
  maxJitter = 0.3,
}: {
  /** The harness instance to watch for live edits */
  harness: Harness;

  /**
   * Current retry attempt count. Starts at 0 and increments with each retry.
   * @default 0
   */
  count?: number;

  /**
   * Base delay in milliseconds between retry attempts.
   * The actual delay will be: baseDelay * (2 ^ retryCount) ± jitter
   * @default 1000
   */
  baseDelay?: number;

  /**
   * Maximum number of retry attempts before giving up.
   * @default 5
   */
  maxRetries?: number;

  /**
   * Maximum jitter factor to apply to the delay.
   * A value of 0.3 means the delay will be randomized by ±30%.
   * This helps prevent thundering herd problems in distributed systems.
   * @default 0.3
   */
  maxJitter?: number;
}): Promise<void> {
  return harness.startWatchingLiveEdits().catch(async (err) => {
    console.error(err);
    if (count < maxRetries) {
      // Calculate exponential backoff
      const exponentialDelay = baseDelay * Math.pow(2, count);

      // Add random jitter (±30% by default)
      const jitterRange = exponentialDelay * maxJitter;
      const jitter = Math.random() * jitterRange * 2 - jitterRange;
      const finalDelay = exponentialDelay + jitter;

      await sleep(Math.floor(finalDelay));

      return startAndKeepWatchingLiveEdits({
        harness,
        count: count + 1,
        baseDelay,
        maxRetries,
        maxJitter,
      });
    }
    throw err;
  });
}
