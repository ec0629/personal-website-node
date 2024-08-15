import { importJWK, jwtVerify } from "jose";
import querystring from "node:querystring";
import { URLSearchParams } from "node:url";

export function getOauthRedirectUri() {
  const qs = querystring.stringify({
    client_id: process.env.YAHOO_CLIENT_ID_OIDC,
    redirect_uri: process.env.REDIRECT_URI,
    response_type: "code",
    scope: "openid",
    // nonce,
  });

  return `https://api.login.yahoo.com/oauth2/request_auth?${qs}`;
}

export async function getAccessTokenFromUrl(reqParams) {
  const { code } = reqParams;

  const body = new URLSearchParams({
    client_id: process.env.YAHOO_CLIENT_ID_OIDC,
    client_secret: process.env.YAHOO_CLIENT_SECRET_OIDC,
    redirect_uri: process.env.REDIRECT_URI,
    code,
    grant_type: "authorization_code",
  });

  try {
    const response = await fetch(
      "https://api.login.yahoo.com/oauth2/get_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

    if (!response.ok) {
      // Handle YahooError?
      // console.error(await response.text());
      throw new Error(
        `Response.text: ${await response.text()}; Response.status: ${
          response.status
        }`
      );
    }

    return await response.json();
  } catch (e) {
    console.error(e.message);
  }
}

export async function verifyYahooJwt(token) {
  try {
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
  } catch (e) {
    console.error(e);
  }
}
