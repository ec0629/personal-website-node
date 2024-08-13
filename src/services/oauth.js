import { OAuth2Client } from "@badgateway/oauth2-client";

function getOauthClient() {
  return new OAuth2Client({
    server: "https://api.login.yahoo.com",
    clientId: process.env.YAHOO_CLIENT_ID,
    clientSecret: process.env.YAHOO_CLIENT_SECRET,
    authorizationEndpoint: "/oauth2/request_auth",
    tokenEndpoint: "/oauth2/get_token",
  });
}

export function getOauthRedirectUrl() {
  const client = getOauthClient();
  // const codeVerifier = await generateCodeVerifier();

  return client.authorizationCode.getAuthorizeUri({
    // URL in the app that the user should get redirected to after authenticating
    redirectUri: process.env.REDIRECT_URI,

    // Optional string that can be sent along to the auth server. This value will
    // be sent along with the redirect back to the app verbatim.
    // state: 'some-string',

    // codeVerifier,

    // scope: ['scope1', 'scope2'],
  });
}

export function getAccessTokenFromUrl(url) {
  const client = getOauthClient();
  return client.authorizationCode.getTokenFromCodeRedirect(new URL(url), {
    redirectUri: process.env.REDIRECT_URI,
  });
}
