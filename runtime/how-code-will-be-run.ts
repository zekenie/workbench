import { VM } from "vm";
import { webcrypto } from "crypto";

/**
 * Base context provided to all VMs
 * @see https://bun.sh/docs/runtime/globals
 */
const baseContext = {
  // Networking
  fetch: globalThis.fetch,
  WebSocket: globalThis.WebSocket,
  Request: globalThis.Request,
  Response: globalThis.Response,
  Headers: globalThis.Headers,

  // Bun APIs
  Bun: globalThis.Bun,
  Database: globalThis.Database,
  File: globalThis.File,
  FileSystemRouter: globalThis.FileSystemRouter,

  // Memory and threading
  ArrayBuffer: globalThis.ArrayBuffer,
  SharedArrayBuffer: globalThis.SharedArrayBuffer,

  // Standard library
  console,
  process,
  Buffer,
  URL,
  URLSearchParams,
  TextEncoder,
  TextDecoder,
  crypto: webcrypto,

  // Timers
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  setImmediate,
  clearImmediate,
  queueMicrotask,

  // Utils
  Math,
  Date,
  JSON,
  Error,
  performance: globalThis.performance,

  // Observable runtime will be injected here
  module: null,
};

/**
 * Creates an isolated VM environment that can progressively add functions
 * and wire them to Observable's runtime
 */
export function createRuntimeEnvironment() {
  const vm = new VM({
    contextName: "observable-context",
    contextOrigin: "node",
  });

  const context = vm.createContext(baseContext);

  /**
   * Adds a function to the VM context
   * @param id - Function identifier/name
   * @param code - Complete function declaration as string
   */
  function addFunction(id: string, code: string) {
    vm.runInContext(code, context);
  }

  /**
   * Sets up Observable runtime in the VM and returns a function to wire cells
   * @param runtime - Observable Runtime instance
   */
  function wireToObservable(runtime: any) {
    const module = runtime.module();
    context.module = module;

    /**
     * Wires a function in the context to Observable's runtime
     * @param id - Function identifier matching the declaration
     * @param deps - Array of dependency names
     */
    return function wireFunction(id: string, deps: string[] = []) {
      vm.runInContext(
        `
        module.variable().define("${id}", ${JSON.stringify(deps)}, ${id});
      `,
        context
      );
    };
  }

  return {
    addFunction,
    wireToObservable,
    context, // Exposed for testing/debugging
  };
}

/* Usage:
const env = createRuntimeEnvironment();

// Add cells
env.addFunction('data', 'function data() { return fetch("...").then(r => r.json()) }');
env.addFunction('chart', 'function chart(data) { return Plot.plot({marks: [Plot.dot(data)]}) }');

// Wire to Observable
const wire = env.wireToObservable(runtime);
wire('data', []);
wire('chart', ['data']);
*/
