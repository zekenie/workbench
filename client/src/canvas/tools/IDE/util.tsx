import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  TLResizeInfo,
  getDefaultColorTheme,
  resizeBox,
  useIsDarkMode,
} from "tldraw";
import { Badge } from "@/components/ui/badge";
import { IDEProps } from "./props";
import { languageClasses, IDEShape, NAME } from "./types";
import { IDE } from "@/components/ui/ide";
import { useDependencies } from "@/runtime";
import { LanguageDropdown } from "./language-dropdown";
// import { IDE } from './IDE';

export class IDEUtil extends ShapeUtil<IDEShape> {
  static override type = NAME;
  static override props = IDEProps;

  override isAspectRatioLocked(_shape: IDEShape) {
    return false;
  }
  override canResize(_shape: IDEShape) {
    return true;
  }

  getDefaultProps(): IDEShape["props"] {
    return {
      w: 300,
      h: 300,
      color: "black",
      language: "ts",
      title: "",
      code: "",
      private: true,
    };
  }

  canScroll(_shape: IDEShape): boolean {
    return true;
  }

  getGeometry(shape: IDEShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,

      isFilled: true,
    });
  }

  component(shape: IDEShape) {
    const isDarkMode = useIsDarkMode();
    const dependencies = useDependencies(shape.id);
    const theme = getDefaultColorTheme({
      isDarkMode: this.editor.user.getIsDarkMode(),
    });

    return (
      <>
        <div
          className="z-10 pointer-events-auto absolute transform -translate-y-8 right-0 flex flex-row space-x-2"
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <Badge
            className="z-10 pointer-events-auto cursor-pointer"
            role="button"
            onClick={() => {
              this.editor.updateShape({
                id: shape.id,
                type: NAME,
                props: { private: !shape.props.private },
              });
            }}
            variant={shape.props.private ? "outline" : "default"}
          >
            {shape.props.private ? "Private" : "Public"}
          </Badge>
        </div>
        <HTMLContainer
          id={shape.id}
          className="flex flex-col"
          style={{
            border: "1px solid black",
            overflow: "hidden",

            pointerEvents: "all",
            backgroundColor: theme[shape.props.color].semi,
            color: theme[shape.props.color].solid,
          }}
        >
          <div
            className={`${
              languageClasses[shape.props.language]
            } flex justify-between flex-row text-black font-bold bg-gradient-to-r from-purple-500/15 to-pink-500/15 items-center flex-shrink-0 h-[45px]`}
          >
            <input
              placeholder="Node name"
              className="px-2 w-full bg-transparent placeholder-slate-300 text-slate-100 h-full"
            />
            <LanguageDropdown
              onSelect={(lang) =>
                this.editor.updateShape({
                  id: shape.id,
                  type: NAME,
                  props: { language: lang },
                })
              }
              language={shape.props.language}
              className="mr-2 text-slate-100"
            />
          </div>
          <IDE
            language={shape.props.language}
            dependencies={dependencies}
            code={shape.props.code}
            width={shape.props.w}
            height={shape.props.h - 45}
            isDarkMode={isDarkMode}
            onCodeChange={(code) =>
              this.editor.updateShape({
                id: shape.id,
                type: NAME,
                props: { code },
              })
            }
          />
        </HTMLContainer>
      </>
    );
  }

  indicator(shape: IDEShape) {
    return <rect width={shape.props.w} height={shape.props.h} />;
  }

  override onResize(shape: IDEShape, info: TLResizeInfo<IDEShape>) {
    return resizeBox(shape, info);
  }
}
