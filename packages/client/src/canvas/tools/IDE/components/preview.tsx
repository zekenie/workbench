import { HTMLContainer, getDefaultColorTheme } from "tldraw";
import { IDEShape } from "../types";
import { languageClasses } from "../types";

interface PreviewProps {
  shape: IDEShape;
  theme: ReturnType<typeof getDefaultColorTheme>;
}

export const Preview = ({ shape, theme }: PreviewProps) => {
  return (
    <HTMLContainer>
      <div
        className="w-full h-full flex flex-col"
        style={{
          border: "1px solid black",
          backgroundColor: theme[shape.props.color].semi,
          color: theme[shape.props.color].solid,
        }}
      >
        <div
          className={`${languageClasses[shape.props.language]} h-[45px] bg-gradient-to-r from-purple-500/15 to-pink-500/15`}
        />
        <div className="flex-1 p-2">
          <div className="w-full h-full rounded border border-slate-700/20" />
        </div>
      </div>
    </HTMLContainer>
  );
};
