// import { OAuth2Client } from "@badgateway/oauth2-client";
import querystring from "node:querystring";
import { URLSearchParams } from "node:url";

// function getOauthClient() {
//   return new OAuth2Client({
//     server: "https://api.login.yahoo.com",
//     clientId: process.env.YAHOO_CLIENT_ID_OIDC,
//     clientSecret: process.env.YAHOO_CLIENT_SECRET_OIDC,
//     authorizationEndpoint: "/oauth2/request_auth",
//     tokenEndpoint: "/oauth2/get_token",
//   });
// }

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
      console.error(await response.text());
      throw new Error(`Response.status: ${response.status}`);
    }

    return response.json();
  } catch (e) {
    console.error(e.message);
  }
}

// export function getOauthRedirectUri(nonce) {
//   const client = getOauthClient();
//   // const codeVerifier = await generateCodeVerifier();

//   return client.authorizationCode.getAuthorizeUri({
//     // URL in the app that the user should get redirected to after authenticating
//     redirectUri: process.env.REDIRECT_URI,

//     // Optional string that can be sent along to the auth server. This value will
//     // be sent along with the redirect back to the app verbatim.
//     // state: 'some-string',

//     // codeVerifier,

//     nonce,

//     scope: ["openid"],
//   });
// }

// export function getAccessTokenFromUrl(url) {
//   const client = getOauthClient();
//   return client.authorizationCode.getTokenFromCodeRedirect(new URL(url), {
//     redirectUri: process.env.REDIRECT_URI,
//   });
// }
