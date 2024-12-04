export type DependencyState = {
  [id: string]: string[];
};

type AddDependencyAction = {
  type: "ADD_DEPENDENCY";
  payload: {
    id: string;
    dependency: string;
  };
};

type RemoveNodeAction = {
  type: "REMOVE_NODE";
  payload: {
    id: string;
  };
};

export type Action = AddDependencyAction | RemoveNodeAction;

export function dependencyReducer(
  state: DependencyState,
  action: Action
): DependencyState {
  switch (action.type) {
    case "ADD_DEPENDENCY":
      const { id, dependency } = action.payload;
      return {
        ...state,
        [id]: state[id]
          ? [...new Set([...state[id], dependency])]
          : [dependency],
      };

    case "REMOVE_NODE":
      const { id: removeId } = action.payload;
      const { [removeId]: removed, ...restState } = state;

      // Remove all references to the removed node from other arrays
      return Object.entries(restState).reduce(
        (newState, [key, dependencies]) => {
          newState[key] = dependencies.filter((dep) => dep !== removeId);
          return newState;
        },
        {} as DependencyState
      );

    default:
      return state;
  }
}
