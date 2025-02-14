import testData from "./testdata.json" with { type: "json" };
import { createPage } from "./";

const json = JSON.stringify(
  createPage({
    object: testData,
    direction: "wide",
  }).toJSON(),
  null,
  2,
);
console.log(json);
