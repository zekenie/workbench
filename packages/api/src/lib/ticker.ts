/*
// Event listener style
const t = ticker(1000);
t.on('tick', () => console.log('tick!'));
setTimeout(() => t.stop(), 5000);

// Async iterator style
async function example() {
  const t = ticker(1000);
  setTimeout(() => t.stop(), 5000);
  
  for await (const _ of t.on('tick')) {
    console.log('tick!');
  }
}

// Using statement
{
  using t = ticker(1000);
  // Timer will be automatically disposed when it goes out of scope
}
*/

import { EventEmitter } from "events";

interface TickerEvents {
  tick: () => void;
  stop: () => void;
}

declare interface Ticker {
  on<E extends keyof TickerEvents>(event: E, listener: TickerEvents[E]): this;
  emit<E extends keyof TickerEvents>(event: E): boolean;
}

class Ticker extends EventEmitter implements Disposable {
  private interval: NodeJS.Timer | null = null;

  constructor(ms: number) {
    super();
    if (ms <= 0) throw new Error("Interval must be positive");

    this.interval = setInterval(() => {
      this.emit("tick");
    }, ms);
  }

  [Symbol.dispose](): void {
    this.stop();
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.emit("stop");
    }
  }
}

function createTicker(ms: number): Ticker {
  return new Ticker(ms);
}

export { createTicker, Ticker };
