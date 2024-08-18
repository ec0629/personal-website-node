import express from "express";
import path from "node:path";
import dotenv from "dotenv";
import session from "express-session";
import sqlite3Session from "better-sqlite3-session-store";
import { engine } from "express-handlebars";
import { notFound } from "@hapi/boom";
import { getDirName } from "./utils.js";
import {
  getAccessTokenFromUrl,
  getOauthRedirectUri,
  verifyYahooJwt,
} from "./services/oauth.js";
import {
  getUserProfileById,
  persistUserProfile,
} from "./repositories/userRepo.js";
import { getDbObject } from "./db.js";
import { getPlayerRankingsAndADP } from "./repositories/footballRepo.js";
import { tableMetaData } from "./dbMaps.js";

const __dirname = getDirName(import.meta.url);
dotenv.config(path.join(__dirname, "..", ".env"));

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..", "public")));

const SqliteStore = sqlite3Session(session);

const sessionOptions = {
  cookie: {},
  resave: false,
  saveUninitialized: false,
  secret: "keyboard cat",
  store: new SqliteStore({
    client: getDbObject(),
    expired: {
      clear: true,
      intervalMs: 15 * 60 * 1000, // 15 min converted to ms
    },
  }),
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionOptions.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionOptions));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.get("/", function (req, res) {
  res.render("home", { title: "JeffSimonitto.com" });
});

app.get("/login", function (req, res) {
  const { userId } = req.session;

  if (userId) {
    return res.redirect("/dashboard");
  }

  const redirectUri = getOauthRedirectUri();

  return res.redirect(redirectUri);
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

  const user = persistUserProfile({
    accessToken: access_token,
    refreshToken: refresh_token,
    givenName: jwt.given_name,
    familyName: jwt.family_name,
    nickname: jwt.nickname,
    email: jwt.email,
    expiresAt,
  });

  req.session.userId = user.id;

  return res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
  const { userId } = req.session;

  if (!userId) {
    // TODO: can I just create a new custom Error instead
    throw new Error("Authentication Error");
  }

  const { nickname } = getUserProfileById(userId);

  res.render("dashboard", { nickname });
});

app.get("/research", (req, res) => {
  const { userId } = req.session;

  if (!userId) {
    // TODO: can I just create a new custom Error instead
    throw new Error("Authentication Error");
  }

  const { nickname } = getUserProfileById(userId);

  const th = tableMetaData.find((obj) => obj.id === "etr_rank");
  th.sortClass = "sort";
  const data = getPlayerRankingsAndADP(th.orderBy, "asc");
  return res.render("research", { data, nickname, tableMetaData });
});

app.get("/get_table_body", (req, res) => {
  const { userId } = req.session;

  if (!userId) {
    // TODO: can I just create a new custom Error instead
    throw new Error("Authentication Error");
  }

  const { direction, colVal } = req.query;
  const th = tableMetaData.find((obj) => obj.id === colVal);
  th.sortClass = "sort";
  const data = getPlayerRankingsAndADP(th.orderBy, direction);
  return res.render("table", { data });
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
