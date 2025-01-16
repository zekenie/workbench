import { toast } from "sonner";
import { useEffect, useState } from "react";
import { VMAction, VMState } from "@/runtime/toolbar";
import { ClientType } from "@/backend";

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

export const useRuntimeStateManager = (client: ClientType, id: string) => {
  const [vmState, setVmState] = useState<VMState>("starting");

  useEffect(() => {
    client
      .runtime({ id })
      .get()
      .then(({ data }) => {
        if (data?.state) {
          setVmState(data.state as VMState);
        }
      });
  }, [client, id]);

  const handleVMAction = async (action: VMAction) => {
    const transition = vmStateTransitions[action];
    setVmState(transition.transitionState);

    const actionPromise = transition.action(client, id);
    toast.promise(actionPromise, transition.toast);
    await client.runtime({ id })["wait-for-state"].get({
      // @ts-ignore
      query: { state: transition.targetState },
    });

    setVmState(transition.targetState);
  };

  return { vmState, handleVMAction };
};
