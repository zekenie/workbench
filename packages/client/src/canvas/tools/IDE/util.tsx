import {
  HTMLContainer,
  Rectangle2d,
  ShapeUtil,
  TLResizeInfo,
  getDefaultColorTheme,
  resizeBox,
  useEditor,
  useIsDarkMode,
  useValue,
} from "tldraw";
import { Badge } from "@/components/ui/badge";
import { IDEProps } from "./props";
import { languageClasses, IDEShape, NAME } from "./types";
import { IDE } from "@/components/ui/ide";
import { useDependencies } from "@/runtime";
import { LanguageDropdown } from "./language-dropdown";
import { useRuntimeStateManager } from "@/runtime/toolbar/state";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Preview } from "./components/preview";

export class IDEUtil extends ShapeUtil<IDEShape> {
  static override type = NAME;
  static override props = IDEProps;

  override isAspectRatioLocked() {
    return false;
  }
  override canResize() {
    return true;
  }

  // this "catches" the double click and prevents a default action
  // of adding a text node
  onDoubleClick(shape: IDEShape) {
    return shape;
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

  canScroll(): boolean {
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
    const { vmState } = useRuntimeStateManager();
    const isDarkMode = useIsDarkMode();
    const dependencies = useDependencies(shape.id);
    const editor = useEditor();

    const zoomLevel = useValue("zoom level", () => editor.getZoomLevel(), [
      editor,
    ]);

    const theme = getDefaultColorTheme({
      isDarkMode: this.editor.user.getIsDarkMode(),
    });

    if (zoomLevel < 0.5) {
      // Render simplified version when zoomed out
      return <Preview shape={shape} theme={theme} />;
    }

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
          className="flex flex-1"
          style={{
            border: "1px solid black",
            overflow: "hidden",

            pointerEvents: "all",
            backgroundColor: theme[shape.props.color].semi,
            color: theme[shape.props.color].solid,
          }}
        >
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel className="flex flex-1 flex-col">
              <div
                className={`${
                  languageClasses[shape.props.language]
                } flex justify-between flex-row text-black font-bold bg-gradient-to-r from-purple-500/15 to-pink-500/15 items-center flex-shrink-0 h-[45px]`}
              >
                <input
                  placeholder="Node name"
                  value={shape.props.title}
                  onChange={(e) => {
                    this.editor.updateShape({
                      id: shape.id,
                      type: NAME,
                      props: {
                        title: e.currentTarget.value,
                      },
                    });
                  }}
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
            </ResizablePanel>
            {vmState === "started" && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={15}>Values go here</ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
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
