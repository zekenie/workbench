export class StateMachine<S extends string, E extends string> {
  private currentState: S;
  private readonly transitions: ReadonlyMap<S, ReadonlyMap<E, S>>;
  private readonly wildcardTransitions: ReadonlyMap<E, S>;

  constructor(
    initialState: S,
    transitions: ReadonlyMap<S, ReadonlyMap<E, S>>,
    wildcardTransitions: ReadonlyMap<E, S>
  ) {
    this.currentState = initialState;
    this.transitions = transitions;
    this.wildcardTransitions = wildcardTransitions;
  }

  trigger(event: E): boolean {
    const stateTransitions = this.transitions.get(this.currentState);
    let nextState =
      stateTransitions?.get(event) || this.wildcardTransitions.get(event);

    if (nextState) {
      this.currentState = nextState;
      return true;
    }
    return false;
  }

  getCurrentState(): S {
    return this.currentState;
  }

  overwrite(s: S) {
    this.currentState = s;
    return this;
  }

  canTrigger(event: E): boolean {
    return (
      this.transitions.get(this.currentState)?.has(event) ||
      this.wildcardTransitions.has(event)
    );
  }

  getAvailableEvents(): E[] {
    const stateEvents = Array.from(
      this.transitions.get(this.currentState)?.keys() || []
    );
    const wildcardEvents = Array.from(this.wildcardTransitions.keys());
    return [...new Set([...stateEvents, ...wildcardEvents])];
  }
}

export class StateMachineBuilder<S extends string, E extends string> {
  private initialState: S;
  private transitions: Map<S, Map<E, S>>;
  private wildcardTransitions: Map<E, S>;

  constructor(initialState: S) {
    this.initialState = initialState;
    this.transitions = new Map();
    this.wildcardTransitions = new Map();
  }

  addEvent(event: E, fromState: S | "*", toState: S): this {
    if (fromState === "*") {
      this.wildcardTransitions.set(event, toState);
    } else {
      if (!this.transitions.has(fromState)) {
        this.transitions.set(fromState, new Map());
      }
      this.transitions.get(fromState)!.set(event, toState);
    }
    return this;
  }

  create(): StateMachine<S, E> {
    return new StateMachine(
      this.initialState,
      this.transitions,
      this.wildcardTransitions
    );
  }
}

export function stateMachineFactory<S extends string, E extends string>(
  initialState: S
): StateMachineBuilder<S, E> {
  return new StateMachineBuilder<S, E>(initialState);
}
