import { stateMachineFactory } from "@/lib/state-machine";

type State =
  | "unauthenticated"
  | "authenticated"
  | "stale"
  | "loading"
  | "failed";

type Action =
  | "login"
  | "logout"
  | "error"
  | "signup"
  | "refresh"
  | "tokenExpired"
  | "tokenObtained"
  | "hasPersistedTokens";
const authStateMachine = stateMachineFactory<State, Action>("unauthenticated")
  .addEvent("login", "unauthenticated", "loading")
  .addEvent("hasPersistedTokens", "unauthenticated", "stale")
  .addEvent("tokenExpired", "authenticated", "stale")
  .addEvent("login", "failed", "loading")
  .addEvent("signup", "unauthenticated", "loading")
  .addEvent("signup", "failed", "loading")
  .addEvent("error", "loading", "failed")
  .addEvent("refresh", "stale", "loading")
  .addEvent("tokenObtained", "*", "authenticated")
  .addEvent("logout", "authenticated", "unauthenticated");

interface BaseAuthState {
  state: State;
  error: null | string;
  jwt: string | null;
  refreshToken: string | null;
}

interface Unauthenticated extends BaseAuthState {
  state: "unauthenticated";
  error: null;
  jwt: null;
  refreshToken: null;
}

interface Loading extends BaseAuthState {
  state: "loading";
  error: null;
  jwt: null;
  refreshToken: null;
}

interface Authenticated extends BaseAuthState {
  state: "authenticated";
  error: null;
  jwt: string;
  refreshToken: string;
}

interface Stale extends BaseAuthState {
  state: "stale";
  error: null;
  jwt: string;
  refreshToken: string;
}

interface Failed extends BaseAuthState {
  state: "failed";
  error: string;
  jwt: null;
  refreshToken: null;
}

export interface PossibleStates {
  Unauthenticated: Unauthenticated;
  Loading: Loading;
  Authenticated: Authenticated;
  Stale: Stale;
  Failed: Failed;
}

type AuthState = Unauthenticated | Loading | Authenticated | Stale | Failed;

export type Tokens = { jwt: string; refreshToken: string };

type ActionObject<A extends Action, P = never> =
  | {
      type: A;
      payload?: P;
    }
  | {
      type: A;
      payload: P;
    };

// type Action = "login" | "logout" | "error" | "signup" | "refresh" | "tokenObtained";

type AuthAction =
  | ActionObject<"login">
  | ActionObject<"hasPersistedTokens", Tokens>
  | ActionObject<"logout">
  | ActionObject<"tokenExpired">
  | ActionObject<"error", string>
  | ActionObject<"signup">
  | ActionObject<"refresh">
  | ActionObject<"tokenObtained", Tokens>;

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  console.log("state", state);
  console.log("action", action);
  const machine = authStateMachine.create().overwrite(state.state);
  if (!machine.canTrigger(action.type)) {
    throw new Error(
      `Invalid state transition. cannot trigger ${action.type} from  ${state.state}`
    );
  }

  machine.trigger(action.type);

  let nextState: AuthState = state;

  switch (action.type) {
    case "login":
      nextState = {
        state: "loading",
        jwt: null,
        refreshToken: null,
        error: null,
      };
      break;
    case "hasPersistedTokens":
      nextState = {
        state: "stale",
        jwt: action.payload?.jwt!,
        refreshToken: action.payload?.refreshToken!,
        error: null,
      };
      break;
    case "tokenExpired":
      nextState = {
        state: "stale",
        jwt: state.jwt!,
        refreshToken: state.refreshToken!,
        error: null,
      };
      break;
    case "logout":
      nextState = {
        state: "unauthenticated",
        jwt: null,
        refreshToken: null,
        error: null,
      };
      break;
    case "error":
      nextState = {
        state: "failed",
        error: action.payload as string,
        jwt: null,
        refreshToken: null,
      };
      break;
    case "refresh":
      nextState = {
        state: "loading",
        jwt: null,
        refreshToken: null,
        error: null,
      };
      break;
    case "signup":
      nextState = {
        state: "loading",
        jwt: null,
        refreshToken: null,
        error: null,
      };
      break;
    case "tokenObtained":
      nextState = {
        state: "authenticated",
        jwt: action.payload?.jwt!,
        error: null,
        refreshToken: action.payload?.refreshToken!,
      };
      break;
  }
  if (nextState.state !== machine.getCurrentState()) {
    throw new Error("reducer ended up in invalid state");
  }

  return nextState;
}

export const initialState: AuthState = {
  state: "unauthenticated",
  jwt: null,
  refreshToken: null,
  error: null,
};
