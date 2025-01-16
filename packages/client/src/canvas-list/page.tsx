import { useCallback, useState } from "react";
import { useAuthenticated } from "../auth/provider";
import { useQuery } from "@tanstack/react-query";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientType } from "@/backend";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Code, Bot, Workflow } from "lucide-react";

function useCanvases() {
  const [page, setPage] = useState(0);
  const take = 20;

  const auth = useAuthenticated();

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["canvases", page, take],
    queryFn: () => {
      return auth?.client.canvases.list.get({
        query: {
          skip: page * take,
          take,
        },
      });
    },
  });

  const createCanvas = useCallback(
    async (...args: Parameters<ClientType["canvases"]["create"]["post"]>) => {
      const canvas = await auth?.client.canvases.create.post(...args);
      setPage(0);
      refetch();
      return canvas?.data?.id;
    },
    [refetch, auth?.client]
  );

  return {
    createCanvas,
    setPage,
    page,
    refetch,
    data: data?.data,
    error: error || data?.error,
    isLoading,
  };
}

export const CanvasListPage = () => {
  const { data, error, isLoading, createCanvas, page, setPage } = useCanvases();
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[125px] rounded" />
        <Skeleton className="h-[125px] rounded" />
        <Skeleton className="h-[125px] rounded" />
      </div>
    );
  }

  console.log({ data, error, isLoading });

  if (error) {
    console.error(error);
    return (
      <Alert variant="destructive">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          There was an error loading your canvases!
        </AlertDescription>
      </Alert>
    );
  }

  // if (true) {
  if (data?.records.length === 0) {
    return (
      <div className="container mt-24">
        <EmptyState
          action={{
            label: "Create canvas",
            onClick: () => {
              createCanvas({});
            },
          }}
          title="Ziltch"
          icons={[Code, Bot, Workflow]}
          description="You don't have any canvases yet"
        />
      </div>
    );
  }

  return (
    <div className="rounded p-8 shadow-2xl container border mt-12 bg-white">
      <div className="flex flex-row justify-between items-center">
        <h2 className="text-xl px-2">Canvases</h2>
        <Button
          onClick={() => {
            createCanvas({});
          }}
        >
          New canvas
        </Button>
      </div>
      <ul className="mt-8 no-scrollbar grid gap-4 overflow-auto pb-16 pt-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.records.map((record) => (
          <li
            key={record.id}
            className="cursor-pointer rounded-lg border p-4 hover:shadow-md"
          >
            <Link to={`/canvases/${record.id}`} className="flex flex-col gap-1">
              {/* <Link
                to={`/canvases/${record.id}`}
                className="font-medium text-gray-900"
              >
                {record.title || `Untitled (${record.id})`}
              </Link>
              {record.description && (
                <p className="text-sm text-gray-500">{record.description}</p>
              )} */}

              <div className="mb-8 flex items-center justify-between">
                <div
                  className={`flex size-10 items-center justify-center rounded-lg bg-muted p-2`}
                >
                  i
                </div>
                {/* <Button
                  variant="outline"
                  size="sm"
                  className={`${app.connected ? "border border-blue-300 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900" : ""}`}
                >
                  {app.connected ? "Connected" : "Connect"}
                </Button> */}
              </div>
              <div>
                <h2 className="mb-1 font-semibold">
                  {record.title || `Untitled (${record.id})`}
                </h2>
                <p className="line-clamp-2 text-gray-500">
                  {record.description || "Description goes here"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
