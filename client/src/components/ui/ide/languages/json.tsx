// import { jsonSchema } from "codemirror-json-schema";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter } from "@codemirror/lint";

const extensions = ({ dependencies }: { dependencies: string[] }) => [
  json(),
  // jsonParseLinter(),
  linter(jsonParseLinter()),
];

export default extensions;
