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

function useCanvases() {
  const [page, setPage] = useState(0);
  const take = 20;

  const auth = useAuthenticated();

  console.log({ auth });

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

  if (data?.records.length === 0) {
    return (
      <EmptyState
        onAction={() => {
          createCanvas({});
        }}
        title="So much is yet to come..."
        icon="add"
        actionLabel="Create canvas"
        description="You don't have any canvases yet"
      />
    );
  }

  return (
    <div className="rounded p-2">
      <div className="flex flex-row justify-between items-center">
        <h2>Canvases</h2>
        <Button
          onClick={() => {
            createCanvas({});
          }}
        >
          New canvas
        </Button>
      </div>
      <ul className="divide-y divide-gray-200 ">
        {data?.records.map((record) => (
          <li
            key={record.id}
            className="cursor-pointer p-4 hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            <div className="flex flex-col gap-1">
              <Link
                to={`/canvases/${record.id}`}
                className="text-lg font-medium text-gray-900"
              >
                {record.title || `Untitled (${record.id})`}
              </Link>
              <p className="text-sm text-gray-500">{record.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
