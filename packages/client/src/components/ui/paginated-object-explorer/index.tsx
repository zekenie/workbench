import { nestPage } from "./nest";
import { TreeNode } from "./tree-node";
import type { PageJSON } from "./types";

const PaginatedObjectExplorer = ({ data }: { data: PageJSON }) => {
  const nested = nestPage(data);

  return (
    <div className="m-8 font-mono text-md flex flex-row space-x-2">
      <TreeNode data={nested} depth={0} />
    </div>
  );
};
export default PaginatedObjectExplorer;
