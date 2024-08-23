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
  const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey};out=settings,draftresults,teams?format=json_f`;

  const response = await client.fetchJson(url);

  const { league: l } = response.fantasy_content;
  const { settings } = response.fantasy_content.league;

  const viewData = {
    leagueName: l.name,
    leagueId: l.league_id,
    numTeams: l.num_teams,
    leagueLogo: l.logo_url,
    draftStatus: l.draft_status,
    draftCompleted: l.draft_status === "postdraft",
    draftTime: settings.draft_time * 1000,
    rosterPositions: settings.roster_positions.map((p) => p.roster_position),
    leagueKey,
    teams: l.teams.map((t) => {
      const team = t.team;
      return {
        name: team.name,
        teamId: parseInt(team.team_id),
        teamKey: team.team_key,
        draftPosition: team.draft_position,
        teamLogo: team.team_logos[0].team_logo.url,
      };
    }),
    draftResults: l.draft_results.map((d) => {
      const { draft_result: dr } = d;
      return {
        pick: dr.pick,
        playerKey: dr.player_key,
        round: dr.round,
        teamKey: dr.team_key,
      };
    }),
  };

  return viewData;
}

export async function getUsersLeaguesAndTeams(client) {
  // const url =
  //   "https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;seasons=2024;is_available=1;game_codes=nfl;out=leagues,teams?format=json_f";
  const url =
    "https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;seasons=2024;is_available=1;game_codes=nfl/leagues;out=settings,draftresults/teams/roster?format=json_f";

  const response = await client.fetchJson(url);

  const userInfo = response?.fantasy_content?.users[0]?.user;

  if (!userInfo) {
    throw new Error("No user information provided by request.");
  }

  return userInfo?.games.at(-1)?.game?.leagues.map((l) => {
    const {
      draft_status,
      league_id,
      league_key,
      name,
      num_teams,
      settings,
      teams,
    } = l.league;
    const draftDate = new Date(parseInt(settings.draft_time) * 1000);
    const team = teams[0].team;
    return {
      leagueId: league_id,
      leagueKey: league_key,
      name,
      numTeams: num_teams,
      draftStatus: draft_status,
      draftMessage:
        draft_status === "postdraft" ? "Completed" : draftDate.toLocaleString(),
      draftTime: settings.draft_time,
      team: {
        name: team.name,
        teamId: team.team_id,
        logoUrl: team.team_logos[0]?.team_logo?.url,
      },
    };
  });
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
