import {
  defaultBindingUtils,
  defaultShapeUtils,
  Editor,
  TLAssetStore,
  Tldraw,
} from "@tldraw/tldraw";
import { useSync } from "@tldraw/sync";
import React, { useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/auth/provider";
import { IDEUtil } from "./tools/IDE/util";
import { components, staticAssets, uiOverrides } from "./ui-overrides";
import { IDEShapeTool } from "./tools/IDE/tool";
import { DependencyGraphProvider } from "@/runtime";
import { RuntimeControlToolbar } from "@/runtime/toolbar";
import { useRuntimeStateManager } from "@/runtime/toolbar/state";

export const customShapeUtils = [IDEUtil];
export const customTools = [IDEShapeTool];

const myAssetStore: TLAssetStore = {
  async upload(file, asset) {
    return "";
  },
  resolve(asset) {
    return "";
  },
};

const Canvas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { client } = useAuth();

  const store = useSync({
    shapeUtils: useMemo(() => [...defaultShapeUtils, ...customShapeUtils], []),
    bindingUtils: defaultBindingUtils,
    uri: `ws://localhost:5858/connect/${id}`,
    assets: myAssetStore,
  });

  const { vmState, handleVMAction } = useRuntimeStateManager();

  const onMount = useCallback((editor: Editor) => {
    // Mount logic here if needed
  }, []);

  return (
    <>
      <RuntimeControlToolbar state={vmState} onAction={handleVMAction} />
      <div className="tldraw__editor">
        <DependencyGraphProvider store={store}>
          <Tldraw
            shapeUtils={customShapeUtils}
            tools={customTools}
            store={store}
            onMount={onMount}
            deepLinks
            overrides={uiOverrides}
            components={components}
            assetUrls={staticAssets}
          />
        </DependencyGraphProvider>
      </div>
    </>
  );
};

export default Canvas;
