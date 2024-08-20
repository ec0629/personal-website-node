import querystring from "node:querystring";
import { URLSearchParams } from "node:url";

export function getOauthRedirectUri() {
  const qs = querystring.stringify({
    client_id: process.env.YAHOO_CLIENT_ID_OIDC,
    redirect_uri: process.env.REDIRECT_URI,
    response_type: "code",
    scope: "openid",
  });

  return `https://api.login.yahoo.com/oauth2/request_auth?${qs}`;
}

export function requestAccessToken(code) {
  const body = new URLSearchParams({
    client_id: process.env.YAHOO_CLIENT_ID_OIDC,
    client_secret: process.env.YAHOO_CLIENT_SECRET_OIDC,
    redirect_uri: process.env.REDIRECT_URI,
    code,
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

export function makeOAuthRequestForJson(access_token, url, opts) {
  let options = opts;

  if (typeof options !== "object") {
    options = {};
  }
  if (typeof options.headers !== "object") {
    options.headers = {};
  }

  options.headers = {
    Authorization: `Bearer ${access_token}`,
  };
  return fetchJsonRequest(url, options);
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

// async function refreshAccessToken() {}
