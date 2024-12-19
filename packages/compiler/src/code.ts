/**
 * [{
        state: {
          x: -658.6594151819453,
          y: 310.9192281780287,
          id: "shape:EQlpuHLfu0VOnArKA8HBM",
          meta: {},
          type: "IDE",
          index: "a2C8G",
          props: {
            h: 99.77001072661676,
            w: 300,
            code: 'new Date("1991-04-29")',
            color: "black",
            title: "birthdate",
            private: true,
            language: "ts",
          },
          opacity: 1,
          isLocked: false,
          parentId: "page:y1GxwdmmUrtsVo_m_1gzy",
          rotation: 0,
          typeName: "shape",
        },
        lastChangedClock: 4147,
}...],
 */

/**
 * Filter this down to ide type
 * seperate fn to pick language with switch statement for language (start with just ts)
 * ignore non-ts
 * pull out code and title in obj (reduce into { title1: 'code', title2: 'code2' })
 */

// Types
import type { RoomSnapshot } from "@tldraw/sync-core";
import { ide } from "tools";

type InputShape = { state: ide.IDEShape };

const filterIDEShapes = (shapes: InputShape[]) => {
  return shapes.filter(
    (shape) => shape.state.type === "IDE" && shape.state.props.title !== ""
  );
};

const extractTypeScriptCode = (
  shapes: InputShape[]
): Record<string, string> => {
  return shapes.reduce(
    (acc, shape) => {
      const { props } = shape.state;

      if (!props) {
        return acc;
      }

      // Only process if it's TypeScript
      if (props.language === "ts") {
        acc[props.title] = props.code;
      }

      return acc;
    },
    {} as Record<string, string>
  );
};

export function extractCode(snapshot: RoomSnapshot) {
  const ideShapes = filterIDEShapes(
    snapshot.documents as unknown as InputShape[]
  );
  return extractTypeScriptCode(ideShapes);
}
