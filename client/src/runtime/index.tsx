import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useMemo,
} from "react";
import { TLStoreWithStatus } from "@tldraw/tldraw";
import { DependencyGraph } from "./dependency-graph";
import { DependencyState } from "./dependency-state";
import "./type-defs";

interface DependencyGraphContextType {
  dependencies: DependencyState;
}

const DependencyGraphContext = createContext<DependencyGraphContextType | null>(
  null
);

interface DependencyGraphProviderProps {
  store: TLStoreWithStatus;
  children: React.ReactNode;
}

const EMPTY_ARRAY: readonly string[] = [];

export const DependencyGraphProvider: React.FC<
  DependencyGraphProviderProps
> = ({ store, children }) => {
  const [dependencies, setDependencies] = useState<DependencyState>({});
  const graphRef = useRef<DependencyGraph | null>(null);

  useEffect(() => {
    if (!store.store) {
      return;
    }
    graphRef.current = new DependencyGraph({
      store: store.store,
      onDependencyChange: setDependencies,
    });

    return graphRef.current.listen();
  }, [store]);

  const value = useMemo(() => ({ dependencies }), [dependencies]);

  return (
    <DependencyGraphContext.Provider value={value}>
      {children}
    </DependencyGraphContext.Provider>
  );
};

export const useDependencyGraph = () => {
  const context = useContext(DependencyGraphContext);
  if (!context) {
    throw new Error(
      "useDependencyGraph must be used within a DependencyGraphProvider"
    );
  }
  return context;
};

export const useDependencies = (id: string) => {
  const { dependencies } = useDependencyGraph();
  return dependencies[id] ?? EMPTY_ARRAY;
};
