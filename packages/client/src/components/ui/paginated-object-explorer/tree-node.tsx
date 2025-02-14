import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { NestedObjectKey } from "./nest";
import { last } from "lodash-es";
import KeyPreview, { MoreKeys } from "./key-preview";
import { Button } from "../button";

interface TreeNodeProps {
  data: NestedObjectKey;
  depth: number;
}

export function getValueType(value: any): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return typeof value;
}

const nodeClasses = {
  open: "flex flex-col space-y-1 bg-gray-200/10 border rounded p-2 py-1",
  closed:
    "flex flex-row space-x-1 items-center bg-gray-200/10 border rounded p-2 py-1",
};

export function TreeNode({ data, depth }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isClosed = !isOpen;
  const nextDepth = depth + 1;
  const { children, ...rest } = data;
  return (
    <div className={` ${isOpen ? nodeClasses.open : nodeClasses.closed}`}>
      <div className="flex space-x-1 items-center">
        {/* <div className="text-gray-700">{" {"}</div> */}
        <Button
          variant="ghost"
          size="default"
          className="p-0.5 h-auto"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform ${
              isOpen ? "transform rotate-90" : ""
            }`}
          />
        </Button>
      </div>
      {data.path && <>{data.path}:</>}
      {isClosed && (
        <>
          {rest.preview &&
            rest.preview?.keyPreviews?.map((key) => (
              <KeyPreview key={key.key} keyObj={key} />
            ))}
          {rest.preview?.hasMore && <MoreKeys more={rest.preview?.size} />}
        </>
      )}
      {isOpen && (
        <>
          {Object.entries(children)
            .filter(([k]) => k !== "")
            .map(([k, v]) => {
              return (
                <div
                  className="flex flex-col text-xs"
                  style={{
                    marginLeft: `${nextDepth * 48}px`,
                  }}
                >
                  {/* {k !== "" && <div>{k}:</div>} */}
                  <TreeNode data={v} depth={nextDepth} />
                </div>
              );
            })}
        </>
      )}
      {/* <div className="text-gray-700">{"}"}</div> */}
    </div>
  );
}
