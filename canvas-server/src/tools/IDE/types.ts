import { TLBaseShape, TLDefaultColorStyle } from "@tldraw/tlschema";

export type Language =
  | "ts"
  | "md"
  | "sql"
  | "http"
  | "graphql"
  | "json"
  | "yaml"
  | "toml";

export const NAME = "IDE" as const;
export type IDEShape = TLBaseShape<
  typeof NAME,
  {
    w: number;
    h: number;
    color: TLDefaultColorStyle;
    title: string;
    code: string;
    language: Language;

    // not really optional just too lazy to write migration
    private?: boolean;
  }
>;

type CssClass = string;
export const languageClasses: Record<Language, CssClass> = {
  ts: "bg-typescript",
  md: "bg-markdown",
  sql: "bg-sql",
  http: "bg-http",
  graphql: "bg-graphql",
  json: "bg-json",
  yaml: "bg-yaml",
  toml: "bg-toml",
};
