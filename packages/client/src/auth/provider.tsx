import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import tokenManager from "./token-manager";
import { ClientType } from "@/backend";

type Credentials = {
  email: string;
  password: string;
};

type SessionMethods = {
  login: (credentials: Credentials) => Promise<void>;
  signup: (credentials: Credentials) => Promise<void>;
  logout: () => void;
};

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  client: ClientType;
} & SessionMethods;

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

  if (!context.isAuthenticated) {
    // navigate("/login");
    // return;
    window.location.href = "/login";
    return;
    // throw new UnexpectedlyUnauthenticatedError();
  }

  return context;
}

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Authentication methods
  const login = useCallback(
    async (credentials: Credentials) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const res = await tokenManager.client.auth.login.post(credentials);

        if (res.error) {
          throw new Error(res.error.value.message);
        }

        tokenManager.setTokens(res.data.jwt, res.data.refreshToken);
        setState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : "Login failed",
        });
      }
    },
    [tokenManager]
  );

  const signup = useCallback(
    async (credentials: Credentials) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const res = await tokenManager.client.auth.signup.post(credentials);

        if (res.error) {
          throw new Error(res.error.value.message);
        }

        tokenManager.setTokens(res.data.jwt, res.data.refreshToken);
        setState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : "Signup failed",
        });
      }
    },
    [tokenManager]
  );

  const logout = useCallback(() => {
    tokenManager.clearTokens();
    setState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  // Initial auth check
  // Initial auth check
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!tokenManager.jwt) {
          setState({
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          return;
        }

        if (tokenManager.expired) {
          await tokenManager.refreshTokens();
        }

        // If we get here, we either have a valid token or just refreshed it
        setState({
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    initializeAuth();
  }, []);

  const contextValue = useMemo(
    () => ({
      ...state,
      login,
      signup,
      logout,
      client: tokenManager.client,
    }),
    [state, login, signup, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
