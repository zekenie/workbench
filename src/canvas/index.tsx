import {
  defaultShapeUtils,
  Editor,
  Tldraw,
  useTLStore,
  useValue,
} from "@tldraw/tldraw";
import React, { useCallback } from "react";
import "tldraw/tldraw.css";

import { IDEUtil } from "./tools/IDE/util";
import { components, staticAssets, uiOverrides } from "./ui-overrides";
import { IDEShapeTool } from "./tools/IDE/tool";
import { DependencyGraphProvider } from "@/runtime";

export const customShapeUtils = [IDEUtil];
export const customTools = [IDEShapeTool];

const Canvas: React.FC = () => {
  // const dependencies = useDependencyGraph({ editor });
  //
  // console.log({ dependencies });
  const store = useTLStore({
    shapeUtils: [...defaultShapeUtils, ...customShapeUtils],
  });

  // store.listen(() => {
  //   console.log(store.serialize("all"));
  // });

  // store.listen(({changes}) => {
  //   changes.
  // })

  const onMount = useCallback((editor: Editor) => {
    editor.createShape({
      type: "IDE",
      x: 100,
      y: 100,
      props: {
        title: "foobar",
        code: "",
        private: true,
        language: "ts",
      },
    });
  }, []);

  return (
    <div className="tldraw__editor">
      <DependencyGraphProvider store={store}>
        <Tldraw
          // persistenceKey="fosdfobar"
          shapeUtils={customShapeUtils}
          tools={customTools}
          store={store}
          onMount={onMount}
          overrides={uiOverrides}
          components={components}
          assetUrls={staticAssets}
        ></Tldraw>
      </DependencyGraphProvider>
    </div>
  );
};

export default Canvas;
