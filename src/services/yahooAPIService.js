import { importJWK, jwtVerify } from "jose";
import oauth from "./oauth.js";

//   # a = yahoo.get(
//   #     f"https://fantasysports.yahooapis.com/fantasy/v2/league/{league_key}/players;start=0;count=100"
//   # )
//   # a = yahoo.get(
//   #     f"https://fantasysports.yahooapis.com/fantasy/v2/league/{league_key}/teams;out=roster"
//   # )
//   # a = yahoo.get(
//   #     f"https://fantasysports.yahooapis.com/fantasy/v2/league/{league_key}/draftresults"
//   # )

export function getYahooOAuthConfig() {
  return {
    clientId: process.env.YAHOO_CLIENT_ID_OIDC,
    clientSecret: process.env.YAHOO_CLIENT_SECRET_OIDC,
    redirectUri: process.env.REDIRECT_URI,
  };
}

export function getYahooAuthorizationUrl() {
  return oauth.getAuthorizationUrl(getYahooOAuthConfig());
}

export function requestYahooAccessToken(code) {
  const config = getYahooOAuthConfig();
  return oauth.requestAccessToken({ code, ...config });
}

export async function getLeagueSettings(leagueKey, client) {
  const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/settings?format=json_f`;

  return client.fetchJson(url);
}

export async function getUsersLeaguesAndTeams(client) {
  // const url =
  //   "https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;seasons=2024;is_available=1;game_codes=nfl;out=leagues,teams?format=json_f";
  const url =
    "https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;seasons=2024;is_available=1;game_codes=nfl/leagues;out=settings,draftresults/teams/roster?format=json_f";

  return client.fetchJson(url);
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
