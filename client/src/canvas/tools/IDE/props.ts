import { DefaultColorStyle, RecordProps, T } from "tldraw";
import { IDEShape } from "./types";

// Validation for our custom card shape's props, using one of tldraw's default styles
export const IDEProps: RecordProps<IDEShape> = {
  w: T.number,
  h: T.number,
  color: DefaultColorStyle,
  code: T.string,
  title: T.string,
  language: T.setEnum(
    new Set(["ts", "md", "sql", "http", "graphql", "json", "yaml", "toml"])
  ),

  // not really optional just too lazy to write migration
  private: T.boolean.optional(),
};
