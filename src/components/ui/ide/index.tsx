import { EditorView } from "@codemirror/view";
import CodeMirror, { Extension } from "@uiw/react-codemirror";
import React, { useMemo } from "react";
import typescript from "./languages/typescript";
import markdown from "./languages/markdown";
import { Language } from "@/canvas/tools/IDE/types";

interface IDEProps {
  code: string;
  width: number;
  height: number;
  isDarkMode: boolean;
  dependencies: string[];
  onCodeChange: (code: string) => void;
  language: Language;
}

export const IDE: React.FC<IDEProps> = ({
  code,
  width,
  height,
  isDarkMode,
  onCodeChange,
  dependencies,
  language,
}) => {
  const extensions = useMemo(() => {
    const base: Partial<
      Record<Language, (options: { dependencies: string[] }) => Extension[]>
    > = {
      ts: typescript,
      md: markdown,
    };

    return [
      ...(base[language]?.({ dependencies }) || []),
      EditorView.lineWrapping,
    ];
  }, [language]);
  return (
    <CodeMirror
      value={code}
      basicSetup={{
        tabSize: 2,
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: true,
      }}
      theme={isDarkMode ? "dark" : "light"}
      onChange={onCodeChange}
      width={`${width}px`}
      height={`${height}px`}
      extensions={extensions}
    />
  );
};
