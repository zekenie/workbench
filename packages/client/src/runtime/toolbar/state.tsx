import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { toast } from "sonner";
import { VMAction, VMState } from "@/runtime/toolbar";
import { ClientType } from "@/backend";
import { useAuth } from "@/auth/provider";
import { useParams } from "react-router-dom";

interface RuntimeStateTransition {
  transitionState: VMState;
  targetState: VMState;
  action: (client: ClientType, id: string) => Promise<void>;
  toast: {
    loading: string;
    success: string;
    error: string;
  };
}

const vmStateTransitions: Record<VMAction, RuntimeStateTransition> = {
  start: {
    transitionState: "starting",
    targetState: "started",
    action: async (client, id) => {
      await client.runtime({ id }).start.post();
    },
    toast: {
      loading: "Starting machine",
      success: "Machine started",
      error: "Error starting machine",
    },
  },
  suspend: {
    transitionState: "suspending",
    targetState: "suspended",
    action: async (client, id) => {
      await client.runtime({ id }).suspend.post();
    },
    toast: {
      loading: "pausing machine",
      success: "Machine paused",
      error: "Error pausing machine",
    },
  },
  resume: {
    transitionState: "starting",
    targetState: "started",
    action: async (client, id) => {
      await client.runtime({ id }).start.post();
    },
    toast: {
      loading: "Starting machine",
      success: "Machine started",
      error: "Error starting machine",
    },
  },
  stop: {
    transitionState: "stopping",
    targetState: "stopped",
    action: async (client, id) => {
      await client.runtime({ id }).stop.post();
    },
    toast: {
      loading: "Stopping machine",
      success: "Machine stopped",
      error: "Error stopping machine",
    },
  },
};

interface RuntimeStateContextType {
  vmState: VMState;
  handleVMAction: (action: VMAction) => Promise<void>;
  runtimeId: string | null;
}

const RuntimeStateContext = createContext<RuntimeStateContextType | null>(null);

interface RuntimeStateProviderProps {
  children: ReactNode;
}

export function RuntimeStateProvider({ children }: RuntimeStateProviderProps) {
  const { id: runtimeId } = useParams<{ id: string }>();
  const { client } = useAuth();
  const [vmState, setVmState] = useState<VMState>("starting");
  // const [runtimeId, setRuntimeId] = useState<string | null>(null);

  useEffect(() => {
    if (!runtimeId) return;

    client
      .runtime({ id: runtimeId })
      .get()
      .then(({ data }) => {
        if (data?.state) {
          setVmState(data.state as VMState);
        }
      });
  }, [client, runtimeId]);

  const handleVMAction = async (action: VMAction) => {
    if (!runtimeId) return;

    const transition = vmStateTransitions[action];
    setVmState(transition.transitionState);

    const actionPromise = transition.action(client, runtimeId);
    toast.promise(actionPromise, transition.toast);

    await client.runtime({ id: runtimeId })["wait-for-state"].get({
      // @ts-ignore
      query: { state: transition.targetState },
    });

    setVmState(transition.targetState);
  };

  return (
    <RuntimeStateContext.Provider
      value={{ vmState, handleVMAction, runtimeId: runtimeId as string }}
    >
      {children}
    </RuntimeStateContext.Provider>
  );
}

// Hook that maintains the same API as before
export function useRuntimeStateManager() {
  const context = useContext(RuntimeStateContext);

  if (!context) {
    throw new Error(
      "useRuntimeStateManager must be used within a RuntimeStateProvider"
    );
  }

  const { vmState, handleVMAction } = context;

  return { vmState, handleVMAction };
}
