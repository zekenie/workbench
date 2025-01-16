import * as api from "./api.process";
import * as worker from "./worker.process";
import * as outbox from "./outbox.process";

console.log("starting dev server");

await api.startProcess();
await worker.startProcess();
await outbox.startProcess();
