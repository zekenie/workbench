import { backendClient } from "../../backend";

let jwt: string | null = null;

function setJwt(jwt: string) {
  jwt = jwt;
}

function storeRefreshToken(refreshToken: string) {
  window.localStorage.setItem("refreshToken", refreshToken);
}

function retrieveRefreshToken() {
  return window.localStorage.getItem("refreshToken");
}

async function attemptToStartSessionWithStoredRefreshToken() {
  const existingToken = retrieveRefreshToken();
  if (!existingToken) {
    return {
      loggedIn: false,
      reason: "NO_REFRESH_TOKEN",
    };
  }
  const res = await backendClient.auth.refresh.post({
    refreshToken: existingToken,
  });

  if (res.error) {
    return {
      loggedIn: false,
      reason: "INVALID_REFRESH_TOKEN",
    };
  }

  storeRefreshToken(res.data.refreshToken);
  setJwt(res.data.jwt);
  return {
    loggedIn: true,
  };
}
