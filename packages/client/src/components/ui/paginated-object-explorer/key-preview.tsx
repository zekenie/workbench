import { type ObjectKeyPreview } from "./types";
import {
  Braces,
  Brackets,
  Quote,
  ToggleRight,
  Calendar,
  Ellipsis,
  Hash,
  Type,
  LucideProps,
} from "lucide-react";

const KeyPreview = ({ keyObj }: { keyObj: ObjectKeyPreview }) => {
  switch (keyObj.type) {
    case "object":
      return <ObjectKeyPreview keyObj={keyObj} />;
    case "array":
      return <ArrayKeyPreview keyObj={keyObj} />;
    case "boolean":
      return <BooleanKeyPreview keyObj={keyObj} />;
    case "date":
      return <DateKeyPreview keyObj={keyObj} />;
    case "number":
      return <NumberKeyPreview keyObj={keyObj} />;
    case "string":
      return <StringKeyPreview keyObj={keyObj} />;
    default:
      return <DefaultKeyPreview keyObj={keyObj} />;
  }
};

export const MoreKeys = ({ more }: { more: number }) => (
  <div
    className={`text-xs text-gray-500 rounded bg-gray-200 shadow truncate p-0.5 flex items-center gap-1`}
  >
    +{more}
    {/* <Ellipsis size={12} /> */}
  </div>
);

const BaseKeyPreview = ({
  keyObj,
  icon: Icon,
  className = "",
}: {
  keyObj: ObjectKeyPreview;
  icon: React.ComponentType<LucideProps>;
  className?: string;
}) => {
  return (
    <div
      className={`text-xs border shadow rounded bg-gray-200 truncate p-1 py-0.5 flex items-center gap-2 ${className}`}
    >
      {keyObj.key}: <Icon size={12} />
    </div>
  );
};

const ObjectKeyPreview = ({ keyObj }: { keyObj: ObjectKeyPreview }) => {
  return <BaseKeyPreview keyObj={keyObj} icon={Braces} />;
};

const ArrayKeyPreview = ({ keyObj }: { keyObj: ObjectKeyPreview }) => {
  return <BaseKeyPreview keyObj={keyObj} icon={Brackets} />;
};

const BooleanKeyPreview = ({ keyObj }: { keyObj: ObjectKeyPreview }) => {
  return <BaseKeyPreview keyObj={keyObj} icon={ToggleRight} />;
};

const DateKeyPreview = ({ keyObj }: { keyObj: ObjectKeyPreview }) => {
  return <BaseKeyPreview keyObj={keyObj} icon={Calendar} />;
};

const NumberKeyPreview = ({ keyObj }: { keyObj: ObjectKeyPreview }) => {
  return <BaseKeyPreview keyObj={keyObj} icon={Hash} />;
};

const StringKeyPreview = ({ keyObj }: { keyObj: ObjectKeyPreview }) => {
  return <BaseKeyPreview keyObj={keyObj} icon={Quote} />;
};

const DefaultKeyPreview = ({ keyObj }: { keyObj: ObjectKeyPreview }) => {
  return <BaseKeyPreview keyObj={keyObj} icon={Type} />;
};

export default KeyPreview;
