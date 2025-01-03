import { useEffect, useState } from "react";
import { VMAction, VMState } from "@/runtime/toolbar";
import { ClientType } from "@/backend";

interface RuntimeStateTransition {
  transitionState: VMState;
  targetState: VMState;
  action: (client: ClientType, id: string) => Promise<void>;
}

const vmStateTransitions: Record<VMAction, RuntimeStateTransition> = {
  start: {
    transitionState: "starting",
    targetState: "started",
    action: async (client, id) => {
      await client.runtime({ id }).start.post();
    },
  },
  suspend: {
    transitionState: "suspending",
    targetState: "suspended",
    action: async (client, id) => {
      await client.runtime({ id }).suspend.post();
    },
  },
  resume: {
    transitionState: "starting",
    targetState: "started",
    action: async (client, id) => {
      await client.runtime({ id }).start.post();
    },
  },
  stop: {
    transitionState: "stopping",
    targetState: "stopped",
    action: async (client, id) => {
      await client.runtime({ id }).stop.post();
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

    await transition.action(client, id);
    await client.runtime({ id })["wait-for-state"].get({
      // @ts-ignore
      query: { state: transition.targetState },
    });

    setVmState(transition.targetState);
  };

  return { vmState, handleVMAction };
};
