import {
  defaultBindingUtils,
  defaultShapeUtils,
  Editor,
  TLAssetStore,
  Tldraw,
} from "@tldraw/tldraw";
import { useSync } from "@tldraw/sync";
import React, { useCallback, useMemo } from "react";
import "tldraw/tldraw.css";

import { IDEUtil } from "./tools/IDE/util";
import { components, staticAssets, uiOverrides } from "./ui-overrides";
import { IDEShapeTool } from "./tools/IDE/tool";
import { DependencyGraphProvider } from "@/runtime";
import { useParams } from "react-router-dom";

export const customShapeUtils = [IDEUtil];
export const customTools = [IDEShapeTool];

const myAssetStore: TLAssetStore = {
  async upload(file, asset) {
    return "";
    // return uploadFileAndReturnUrl(file)
  },
  resolve(asset) {
    return "";
  },
};

const Canvas: React.FC = () => {
  // const dependencies = useDependencyGraph({ editor });
  //
  // console.log({ dependencies });
  const { id } = useParams<{ id: string }>();
  const store = useSync({
    shapeUtils: useMemo(() => [...defaultShapeUtils, ...customShapeUtils], []),
    bindingUtils: defaultBindingUtils,
    uri: `ws://localhost:5858/connect/${id}`,

    assets: myAssetStore,
  });

  const onMount = useCallback((editor: Editor) => {
    // editor.createShape({
    //   type: "IDE",
    //   x: 100,
    //   y: 100,
    //   props: {
    //     title: "foobar",
    //     code: "",
    //     private: true,
    //     language: "ts",
    //   },
    // });
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
          deepLinks
          overrides={uiOverrides}
          components={components}
          assetUrls={staticAssets}
        ></Tldraw>
      </DependencyGraphProvider>
    </div>
  );
};

export default Canvas;
