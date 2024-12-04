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
import ts, { ModuleKind, ScriptTarget } from "typescript";
import { autocompletion } from "@codemirror/autocomplete";
const fsMap = await createDefaultMapFromCDN(
  {
    target: ts.ScriptTarget.ES2022,
    typeRoots: ["./node_modules/@types", "./node_modules/bun-types"],
  },
  "5.3.3",
  true,
  ts
);

const extensions = ({ dependencies }: { dependencies: string[] }) => {
  const localFsMap = new Map(fsMap);
  const system = createSystem(localFsMap);
  const compilerOpts: ts.CompilerOptions = {
    target: ScriptTarget.ESNext,
    lib: ["es2022", "esnext"],
    types: ["bun-types"],
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    isolatedModules: true,
    allowJs: true,
    checkJs: true,
    strict: true,
  };
  const env = createVirtualTypeScriptEnvironment(system, [], ts, compilerOpts);
  return [
    javascript({
      typescript: true,
    }),
    tsFacet.of({ env, path: "index.ts" }),
    tsHover(),
    tsLinter(),
    tsSync(),
    // autocompletion({
    // override: [tsAutocomplete()],
    // }),
    // autocompletion({
    //   override: [tsAutocomplete()],
    // }),
  ];
};

export default extensions;
