import express from "express";
import path from "node:path";
import crypto from "node:crypto";
import dotenv from "dotenv";
import { engine } from "express-handlebars";
import { notFound } from "@hapi/boom";
import { getDirName } from "./utils.js";
import {
  getAccessTokenFromUrl,
  getOauthRedirectUri,
  verifyYahooJwt,
} from "./services/oauth.js";
import { persistUserProfile } from "./repositories/userRepo.js";

const __dirname = getDirName(import.meta.url);
dotenv.config(path.join(__dirname, "..", ".env"));

const app = express();

const nonce = crypto.randomBytes(20).toString("base64url");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.get("/", function (req, res) {
  res.render("home", { title: "JeffSimonitto.com" });
});

app.get("/login", function (req, res) {
  const redirectUri = getOauthRedirectUri(nonce);

  res.redirect(redirectUri);
});

app.get("/callback", async (req, res) => {
  const { error, error_description } = req.query;

  if (error) {
    throw new Error(error_description);
  }

  const { access_token, refresh_token, expires_in, id_token } =
    await getAccessTokenFromUrl(req.query);

  const expiresAt = Date.now() + expires_in * 1000;

  const jwt = await verifyYahooJwt(id_token);

  const profile = {
    accessToken: access_token,
    refreshToken: refresh_token,
    givenName: jwt.given_name,
    familyName: jwt.family_name,
    nickname: jwt.nickname,
    email: jwt.email,
    expiresAt,
  };

  persistUserProfile(profile);

  return res.json(profile);
});

app.use((req, res, next) => {
  next(notFound("Page not found."));
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
