import { importJWK, jwtVerify } from "jose";
import { makeOAuthRequestForJson } from "./oauthClient.js";

export async function getLeagueSettings(accessToken) {
  const leagueKey = "449.l.199297";
  const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/settings?format=json_f`;

  return makeOAuthRequestForJson(accessToken, url);
}

export async function getUsersLeagues(accessToken) {
  const url =
    "https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;out=leagues?format=json_f";

  return makeOAuthRequestForJson(accessToken, url);
}

export async function verifyYahooJwtAndDecode(token) {
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
