import codeIcon from "../icons/code.svg";

import {
  DefaultKeyboardShortcutsDialog,
  DefaultKeyboardShortcutsDialogContent,
  DefaultToolbar,
  DefaultToolbarContent,
  TLComponents,
  TldrawUiMenuItem,
  TLUiOverrides,
  ToolbarItem,
  useIsToolSelected,
  useTools,
} from "@tldraw/tldraw";
import { NAME } from "./tools/IDE/types";

export const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    // Create a tool item in the ui's context.
    tools[NAME] = {
      id: NAME,
      icon: "tool-code",
      label: "IDE",
      kbd: "i",
      onSelect: () => {
        editor.setCurrentTool("IDE");
      },
    };
    return tools;
  },
};

export const components: TLComponents = {
  DebugPanel: null,
  Toolbar: (props) => {
    const tools = useTools();
    const isCardSelected = useIsToolSelected(tools[NAME]);
    return (
      <DefaultToolbar {...props}>
        <TldrawUiMenuItem {...tools[NAME]} isSelected={isCardSelected} />
        <DefaultToolbarContent />
      </DefaultToolbar>
    );
  },
  KeyboardShortcutsDialog: (props) => {
    const tools = useTools();
    return (
      <DefaultKeyboardShortcutsDialog {...props}>
        <DefaultKeyboardShortcutsDialogContent />
        {/* Ideally, we'd interleave this into the tools group */}
        <TldrawUiMenuItem {...tools["IDE"]} />
      </DefaultKeyboardShortcutsDialog>
    );
  },
};

export const staticAssets = {
  icons: {
    "tool-code": codeIcon,
  },
};
