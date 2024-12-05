import {
  StateMachine,
  StateMachineBuilder,
  stateMachineFactory,
} from "./state-machine";

describe("StateMachine", () => {
  type States = "idle" | "running" | "paused";
  type Events = "start" | "pause" | "resume" | "stop" | "finish";

  let machine: StateMachine<States, Events>;

  beforeEach(() => {
    const builder = stateMachineFactory<States, Events>("idle");
    builder
      .addEvent("start", "idle", "running")
      .addEvent("pause", "running", "paused")
      .addEvent("resume", "paused", "running")
      .addEvent("stop", "*", "idle");

    machine = builder.create();
  });

  test("initial state is set correctly", () => {
    expect(machine.getCurrentState()).toBe("idle");
  });

  test("trigger transitions to correct states", () => {
    expect(machine.trigger("start")).toBe(true);
    expect(machine.getCurrentState()).toBe("running");

    expect(machine.trigger("pause")).toBe(true);
    expect(machine.getCurrentState()).toBe("paused");

    expect(machine.trigger("resume")).toBe(true);
    expect(machine.getCurrentState()).toBe("running");
  });

  test("wildcard transition works", () => {
    machine.trigger("start");
    expect(machine.getCurrentState()).toBe("running");

    expect(machine.trigger("stop")).toBe(true);
    expect(machine.getCurrentState()).toBe("idle");
  });

  test("invalid transition returns false", () => {
    expect(machine.trigger("pause")).toBe(false);
    expect(machine.getCurrentState()).toBe("idle");
  });

  test("canTrigger returns correct boolean", () => {
    expect(machine.canTrigger("start")).toBe(true);
    expect(machine.canTrigger("pause")).toBe(false);

    machine.trigger("start");

    expect(machine.canTrigger("start")).toBe(false);
    expect(machine.canTrigger("pause")).toBe(true);
  });

  test("getAvailableEvents returns correct events", () => {
    expect(machine.getAvailableEvents()).toEqual(["start", "stop"]);

    machine.trigger("start");

    expect(machine.getAvailableEvents()).toEqual(["pause", "stop"]);
  });

  test("getAvailableEvents returns only wildcard events when current state has no outgoing transitions", () => {
    const builderWithStateWithoutTransitions = stateMachineFactory<
      States,
      Events
    >("idle")
      .addEvent("start", "idle", "running")
      .addEvent("stop", "*", "idle");

    const machineWithStateWithoutTransitions =
      builderWithStateWithoutTransitions.create();

    // Transition to the 'running' state, which has no outgoing transitions
    machineWithStateWithoutTransitions.trigger("start");

    // The only available event should be the wildcard 'stop' event
    expect(machineWithStateWithoutTransitions.getAvailableEvents()).toEqual([
      "stop",
    ]);
  });
});

describe("StateMachineBuilder", () => {
  test("creates a valid state machine", () => {
    const builder = new StateMachineBuilder<"a" | "b", "x" | "y">("a");
    builder
      .addEvent("x", "a", "b")
      .addEvent("y", "b", "a")
      .addEvent("x", "*", "a");

    const machine = builder.create();

    expect(machine.getCurrentState()).toBe("a");
    expect(machine.trigger("x")).toBe(true);
    expect(machine.getCurrentState()).toBe("b");
    expect(machine.trigger("y")).toBe(true);
    expect(machine.getCurrentState()).toBe("a");
  });
});

describe("stateMachineFactory", () => {
  test("returns a valid StateMachineBuilder", () => {
    const builder = stateMachineFactory<"on" | "off", "toggle">("off");
    expect(builder).toBeInstanceOf(StateMachineBuilder);

    builder.addEvent("toggle", "on", "off").addEvent("toggle", "off", "on");

    const machine = builder.create();
    expect(machine).toBeInstanceOf(StateMachine);
    expect(machine.getCurrentState()).toBe("off");
  });
});
