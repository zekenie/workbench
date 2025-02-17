import { ide } from "tools";

export type Language = ide.Language;

export const NAME = ide.NAME;
export type IDEShape = ide.IDEShape;

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
