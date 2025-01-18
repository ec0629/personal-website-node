import querystring from "node:querystring";
import { URLSearchParams } from "node:url";
import { importJWK, jwtVerify } from "jose";

function getYahooOAuthConfig() {
  return {
    clientId: process.env.YAHOO_CLIENT_ID_OIDC,
    clientSecret: process.env.YAHOO_CLIENT_SECRET_OIDC,
    redirectUri: process.env.REDIRECT_URI,
  };
}

export function getYahooAuthorizationUrl() {
  return getAuthorizationUrl(getYahooOAuthConfig());
}

export async function requestYahooAccessToken(code) {
  const config = getYahooOAuthConfig();

  const response = await requestAccessToken({ code, ...config });

  const expires_at = Date.now() + response.expires_in * 1000;
  const jwt = await verifyYahooJwtAndDecode(response.id_token);

  return { ...response, expires_at, jwt };
}

export function getYahooOAuthClient(tokens) {
  const config = getYahooOAuthConfig();
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

function getAuthorizationUrl(config) {
  const qs = querystring.stringify({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid",
  });

  return `https://api.login.yahoo.com/oauth2/request_auth?${qs}`;
}

function requestAccessToken(config) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code: config.code,
    grant_type: "authorization_code",
  });

  return fetchJsonRequest("https://api.login.yahoo.com/oauth2/get_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
}

async function verifyYahooJwtAndDecode(token) {
  const jwksUrl = "https://api.login.yahoo.com/openid/v1/certs";

  const response = await fetch(jwksUrl);

  if (!response.ok) {
    // TODO: YAHOO_ERROR?
    const message = await response.text();
    throw new Error(
      `Response message: ${message}. Response status: ${response.status}`
    );
  }

  const jwks = await response.json();

  const [encodedTokenHeader] = token.split(".");

  const decodedTokenHeader = JSON.parse(
    Buffer.from(encodedTokenHeader, "base64").toString("utf8")
  );
  const kid = decodedTokenHeader.kid;

  const jwk = jwks.keys.find((key) => key.kid === kid);

  if (!jwk) {
    throw new Error("Public key not found in JWKS");
  }

  const key = await importJWK(jwk, jwk.alg);

  const { payload } = await jwtVerify(token, key);

  return payload;
}

export default { getYahooOAuthClient };
