import querystring from "node:querystring";
import { URLSearchParams } from "node:url";

export function buildOAuthClient(config, tokens) {
  return {
    fetchJson: async (url, options) => {
      if (tokens.expiresAt < Date.now()) {
        await refreshAccessToken(config, tokens);
      }
      let opts = buildOptions(options);

      opts.headers = {
        ...opts.headers,
        Authorization: `Bearer ${tokens.accessToken}`,
      };

      return fetchJsonRequest(url, opts);
    },
  };
}

async function refreshAccessToken(config, tokens) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    refresh_token: tokens.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetchJsonRequest(
    "https://api.login.yahoo.com/oauth2/get_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  tokens.accessToken = response.access_token;
  tokens.refreshToken = response.refresh_token;
  tokens.expiresAt = Date.now() + response.expires_in * 1000;

  return tokens;
}

function buildOptions(options) {
  let opts = options;
  if (typeof opts !== "object") {
    opts = {};
  }
  if (typeof opts.headers !== "object") {
    opts.headers = {};
  }

  return opts;
}

async function fetchJsonRequest(url, options) {
  const response = await fetch(url, options);

  if (!response.ok) {
    // Handle fetchError?
    const e = new Error(await response.text());
    e.status = response.status;
    throw e;
  }

  return response.json();
}

export function getAuthorizationUrl(config) {
  const qs = querystring.stringify({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid",
  });

  return `https://api.login.yahoo.com/oauth2/request_auth?${qs}`;
}

export async function requestAccessToken(config) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code: config.code,
    grant_type: "authorization_code",
  });

  const { expires_in, ...rest } = await fetchJsonRequest(
    "https://api.login.yahoo.com/oauth2/get_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  const expires_at = Date.now() + expires_in * 1000;

  return { expires_in, expires_at, ...rest };
}

export default {
  getAuthorizationUrl,
  requestAccessToken,
  buildOAuthClient,
};
