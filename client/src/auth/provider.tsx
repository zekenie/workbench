import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { authReducer, initialState, PossibleStates } from "./state";
import { backendClient, ClientType } from "../backend";
import { createAuthenticatedClient } from "../backend";
import { useNavigate } from "react-router-dom";

type Credentials = {
  email: string;
  password: string;
};

// Idea: do a switch type here sort of like actions with a type.
// That way authenticatedClient isn't even on an unauthenticated state
// that way you don't have to convey the uncertainty of authenticatedApiClient?.foo

// You'd have different hooks too. `useAthenticated()` vs `useSetupAuth()`

// another way would be to just have two hooks but one big context.
// type AuthContextType = {
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   error: string | null;
//   jwt: string | null;
//   login: (credentials: Credentials) => Promise<void>;
//   signup: (credentials: Credentials) => Promise<void>;
//   logout: () => void;
//   authenticatedApiClint: ClientType | null;
// };

class UnexpectedlyUnauthenticatedError extends Error {}
class UnexpectedlyAuthenticatedError extends Error {}

type CreateSessionOptions = {
  login: (credentials: Credentials) => Promise<void>;
  signup: (credentials: Credentials) => Promise<void>;
};

type AuthContextType =
  | (PossibleStates["Unauthenticated"] & CreateSessionOptions)
  | (PossibleStates["Failed"] & CreateSessionOptions)
  | PossibleStates["Loading"]
  | (PossibleStates["Authenticated"] & {
      logout: () => void;
      authenticatedApiClint: ClientType;
    })
  | PossibleStates["Stale"];

const STORAGE_KEY = {
  jwt: "auth_jwt",
  refreshToken: "auth_refresh",
} as const;

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export function useSetupAuth() {
  const context = useAuth();

  const navigate = useNavigate();

  if (["unauthenticated", "failed"].includes(context.state)) {
    return navigate("/boards");
  }

  return context;
}

export function useAuthenticated() {
  const context = useAuth();

  const navigate = useNavigate();

  if (context.state !== "authenticated") {
    navigate("/login");
    return null;
  }

  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const authenticatedApiClint = useMemo(
    () => (state.jwt ? createAuthenticatedClient(state.jwt) : null),
    [state.jwt]
  );

  const refresh = useCallback(async () => {
    if (!state.refreshToken) {
      return;
    }
    try {
      dispatch({ type: "refresh" });
      const response = await backendClient.auth.refresh.post({
        refreshToken: state.refreshToken,
      });
      if (response.data) {
        dispatch({ type: "tokenObtained", payload: response.data });
      }
    } catch (error) {
      dispatch({ type: "error", payload: "Token refresh failed" });
    }
  }, []);

  useEffect(
    function loadTokensFromStorageOnMount() {
      const jwt = localStorage.getItem(STORAGE_KEY.jwt);
      const refreshToken = localStorage.getItem(STORAGE_KEY.refreshToken);

      if (jwt && refreshToken) {
        dispatch({ type: "tokenObtained", payload: { jwt, refreshToken } });
        refresh();
      }
    },
    [refresh]
  );

  const signup = useCallback(async (credentials: Credentials) => {
    const res = await backendClient.auth.signup.post(credentials);
    if (res.error) {
      return dispatch({ type: "error", payload: res.error.value.message });
    }
    dispatch({ type: "tokenObtained", payload: res.data });
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    const res = await backendClient.auth.login.post(credentials);
    if (res.error) {
      return dispatch({ type: "error", payload: res.error.value.message });
    }
    dispatch({ type: "tokenObtained", payload: res.data });
  }, []);

  // const navigate = useNavigate();
  // useEffect(
  //   function redirectOnError() {
  //     navigate("/login");
  //   },
  //   [state.error, navigate]
  // );

  const refreshInterval = useRef<number>();
  useEffect(() => {
    if (state.jwt && state.refreshToken) {
      refresh();
      refreshInterval.current = window.setInterval(refresh, 5 * 60 * 1000);

      return () => {
        if (refreshInterval.current) {
          clearInterval(refreshInterval.current);
        }
      };
    }
  }, [refresh, state.jwt, state.refreshToken]);

  useEffect(
    function syncLocalStorage() {
      if (state.jwt) {
        window.localStorage.setItem(STORAGE_KEY.jwt, state.jwt);
      } else {
        window.localStorage.removeItem(STORAGE_KEY.jwt);
      }

      if (state.refreshToken) {
        window.localStorage.setItem(
          STORAGE_KEY.refreshToken,
          state.refreshToken
        );
      } else {
        window.localStorage.removeItem(STORAGE_KEY.refreshToken);
      }
    },
    [state.jwt, state.refreshToken]
  );

  const logout = useCallback(() => {
    dispatch({ type: "logout" });
  }, []);

  authenticatedApiClint?.hello.get();

  const contextValue: AuthContextType = useMemo(() => {
    if (state.state === "authenticated") {
      return {
        ...state,
        logout,
      };
    }
    if (state.state === "failed") {
      return {
        ...state,
        login,
        signup,
      };
    }

    if (state.state === "unauthenticated") {
      return {
        ...state,
        login,
        signup,
      };
    }

    if (state.state === "loading") {
      return { ...state };
    }

    if (state.state === "stale") {
      return { ...state };
    }

    throw new Error("unsupported state");
  }, [state]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
