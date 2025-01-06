import { ClientType } from "@/backend";
import { treaty } from "../../../../node_modules/@elysiajs/eden";
import type { App } from "../../../api/src/index.process";
import { jwtDecode } from "jwt-decode";

const STORAGE_KEYS = {
  JWT: "auth_jwt",
  REFRESH_TOKEN: "auth_refresh",
} as const;

class TokenManager {
  private static instance: TokenManager;
  private _jwt: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<void> | null = null;
  public client: ClientType;

  private constructor() {
    // Load tokens from storage on initialization
    this._jwt = localStorage.getItem(STORAGE_KEYS.JWT);
    this.refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    this.client = treaty<App>("http://localhost:3000", {
      onRequest: async (path) => {
        // Skip token check for auth endpoints
        if (path.startsWith("/auth")) {
          return {};
        }

        if (this.expired) {
          try {
            await this.refreshTokens();
          } catch (error) {
            return {
              signal: AbortSignal.abort("Authentication required"),
            };
          }
        }

        return {
          headers: {
            authorization: this._jwt ? `Bearer ${this._jwt}` : "",
          },
        };
      },
    });
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  public setTokens(jwt: string, refreshToken: string): void {
    this._jwt = jwt;
    this.refreshToken = refreshToken;
    localStorage.setItem(STORAGE_KEYS.JWT, jwt);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  clearTokens(): void {
    this._jwt = null;
    this.refreshToken = null;
    localStorage.removeItem(STORAGE_KEYS.JWT);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  public get jwt() {
    return this._jwt;
  }

  public get decodedJwt() {
    if (!this._jwt) {
      return;
    }
    return jwtDecode(this._jwt);
  }

  public get expired(): boolean {
    const decoded = this.decodedJwt;
    if (!decoded) return true;
    try {
      return decoded.exp ? Date.now() >= decoded.exp * 1000 : true;
    } catch {
      return true;
    }
  }

  async refreshTokens(): Promise<void> {
    // If already refreshing, return existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Create new refresh promise
    this.refreshPromise = new Promise(async (resolve, reject) => {
      try {
        if (!this.refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await this.client.auth.refresh.post({
          refreshToken: this.refreshToken,
        });

        if (response.error) {
          throw new Error(response.error.value.message);
        }

        this.setTokens(response.data.jwt, response.data.refreshToken);
        resolve();
      } catch (error) {
        this.clearTokens();
        reject(error);
      } finally {
        this.refreshPromise = null;
      }
    });

    return this.refreshPromise;
  }
}

export default TokenManager.getInstance();
