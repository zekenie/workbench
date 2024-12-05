// import { jsonSchema } from "codemirror-json-schema";
import { yaml } from "@codemirror/lang-yaml";

const extensions = ({ dependencies }: { dependencies: string[] }) => [yaml()];

export default extensions;
