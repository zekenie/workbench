import { summarizeSource } from "./summarize-source.service";
const event = {
  type: "IDE",
  event: "canvas.node-change",
  nodeId: "shape:vMgQR-nE-1VCHaVejMBq8",
  canvasId: "019476e2-56a2-7000-99fd-1a5fc90df496",
  typeName: "shape",
};

console.log(
  await summarizeSource({ canvasId: event.canvasId, nodeId: event.nodeId }),
);
