import { javascript } from "@codemirror/lang-javascript";
import {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
} from "@typescript/vfs";
import {
  tsAutocomplete,
  tsFacet,
  tsHover,
  tsLinter,
  tsSync,
} from "@valtown/codemirror-ts";
import ts from "typescript";
import { autocompletion } from "@codemirror/autocomplete";
const fsMap = await createDefaultMapFromCDN(
  { target: ts.ScriptTarget.ES2022 },
  "3.7.3",
  true,
  ts
);

const extensions = ({ dependencies }: { dependencies: string[] }) => {
  const localFsMap = new Map(fsMap);
  const system = createSystem(localFsMap);
  const compilerOpts: ts.CompilerOptions = {};
  const env = createVirtualTypeScriptEnvironment(system, [], ts, compilerOpts);
  return [
    javascript({
      typescript: true,
    }),
    tsHover(),
    tsLinter(),
    tsFacet.of({ env, path: "index.ts" }),
    tsSync(),
    // autocompletion({
    // override: [tsAutocomplete()],
    // }),
    autocompletion({
      override: [tsAutocomplete()],
    }),
  ];
};

export default extensions;
