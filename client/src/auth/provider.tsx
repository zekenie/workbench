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
import { jwtDecode } from "jwt-decode";
import { treaty, Treaty } from "../../../api/node_modules/@elysiajs/eden";
import type { App } from "../../../api/src/";

type Credentials = {
  email: string;
  password: string;
};

type ClientType = Treaty.Create<App>;

class UnexpectedlyUnauthenticatedError extends Error {}
class UnexpectedlyAuthenticatedError extends Error {}

type SessionMethods = {
  login: (credentials: Credentials) => Promise<void>;
  signup: (credentials: Credentials) => Promise<void>;
  logout: () => void;
};

type AuthContextType =
  | (
      | PossibleStates["Unauthenticated"]
      | PossibleStates["Failed"]
      | PossibleStates["Loading"]
      | PossibleStates["Authenticated"]
      | PossibleStates["Stale"]
    ) & { client: ClientType } & SessionMethods;

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

export function useAuthenticated() {
  const context = useAuth();

  if (context.state !== "authenticated") {
    // navigate("/login");
    // return;
    window.location.href = "/login";
    return;
    // throw new UnexpectedlyUnauthenticatedError();
  }

  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const decodedJwt = useMemo(() => {
    if (!state.jwt) {
      return null;
    }
    return jwtDecode(state.jwt);
  }, [state.jwt]);

  const isExpired = useCallback(
    (time: number = Date.now()) => {
      if (!decodedJwt) {
        return false;
      }
      return decodedJwt.exp && time >= decodedJwt.exp * 1000;
    },
    [decodedJwt]
  );

  const backendClient: ClientType = useMemo(() => {
    return treaty<App>("http://localhost:3000", {
      onRequest(path) {
        if (isExpired()) {
          if (state.state !== "stale") {
            dispatch({ type: "tokenExpired" });
          }

          // allow auth reqs to go through, but abort all others
          if (!path.startsWith("/auth")) {
            return {
              signal: AbortSignal.abort("jwt expired"),
            };
          }
        }

        return {};
      },
      headers() {
        return {
          authorization: state.jwt ? `Bearer ${state.jwt}` : "",
        };
      },
    });
  }, [state.jwt, isExpired, state.state]);

  const refresh = useCallback(async () => {
    console.trace("about to refetch");
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
  }, [state, backendClient]);

  useEffect(
    function refreshOnExpired() {
      if (state.refreshToken && state.state === "stale") {
        console.log("refreshOnExpired");
        refresh().catch((err) => {
          console.error("ffffailed to refresh");
          console.error(err);
        });
      }
    },
    [state.refreshToken, state.state]
  );

  useEffect(
    function loadTokensFromStorageOnMount() {
      const jwt = localStorage.getItem(STORAGE_KEY.jwt);
      const refreshToken = localStorage.getItem(STORAGE_KEY.refreshToken);

      if (jwt && refreshToken && state.state === "unauthenticated") {
        dispatch({ type: "tokenObtained", payload: { jwt, refreshToken } });
        refresh();
      }
    },
    [refresh, state]
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

  const refreshInterval = useRef<number>();
  useEffect(() => {
    if (state.jwt && state.refreshToken) {
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
      }

      if (state.refreshToken) {
        window.localStorage.setItem(
          STORAGE_KEY.refreshToken,
          state.refreshToken
        );
      }
    },
    [state.jwt, state.refreshToken]
  );

  const logout = useCallback(() => {
    dispatch({ type: "logout" });
    window.localStorage.removeItem(STORAGE_KEY.refreshToken);
    window.localStorage.removeItem(STORAGE_KEY.jwt);
  }, []);

  const contextValue: AuthContextType = useMemo(() => {
    return {
      ...state,
      login,
      signup,
      logout,
      client: backendClient,
    };
  }, [state]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
