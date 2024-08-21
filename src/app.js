import dotenv from "dotenv";
import path from "node:path";
import express from "express";
import session from "express-session";
import sqlite3Session from "better-sqlite3-session-store";
import { engine } from "express-handlebars";
import { notFound } from "@hapi/boom";
import { asyncWrapper, getDirName } from "./utils.js";
import oauth from "./services/oauth.js";
import { getDbObject } from "./db.js";
import { getPlayerRankingsAndADP } from "./repositories/footballRepo.js";
import { tableMetaData } from "./dbMaps.js";
import {
  getUsersLeagues,
  getYahooAuthorizationUrl,
  getYahooOAuthConfig,
  requestYahooAccessToken,
  verifyYahooJwtAndDecode,
} from "./services/yahooAPIService.js";

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
  const { user } = req.session;

  if (user) {
    return res.redirect("/leagues");
  }

  return res.redirect(getYahooAuthorizationUrl());
});

app.get(
  "/callback",
  asyncWrapper(async (req, res) => {
    const { error, error_description } = req.query;

    if (error) {
      throw new Error(error_description);
    }

    const { code } = req.query;

    const { access_token, refresh_token, expires_at, id_token } =
      await requestYahooAccessToken(code);

    const jwt = await verifyYahooJwtAndDecode(id_token);

    req.session.user = {
      givenName: jwt.given_name,
      familyName: jwt.family_name,
      nickname: jwt.nickname,
      email: jwt.email,
      tokens: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_at,
      },
    };

    return res.redirect("/leagues");
  })
);

app.get(
  "/leagues",
  asyncWrapper(async (req, res) => {
    const { user } = req.session;

    if (!user) {
      return res.redirect("/");
    }

    const { nickname, tokens } = user;
    const client = oauth.buildOAuthClient(getYahooOAuthConfig(), tokens);
    const response = await getUsersLeagues(client);
    const userInfo = response?.fantasy_content?.users[0]?.user;

    if (!userInfo) {
      throw new Error("No user information provided by request.");
    }

    const leagues = userInfo?.games.at(-1)?.game?.leagues.map((l) => l.league);
    res.render("leagues", { nickname, leagues });
  })
);

app.get("/research", (req, res) => {
  const { user } = req.session;

  if (!user) {
    return res.redirect("/");
  }

  const { nickname } = user;

  const th = tableMetaData.find((obj) => obj.id === "etr_rank");
  th.sortClass = "sort-asc";
  const data = getPlayerRankingsAndADP(th.orderBy, "asc");
  return res.render("research", { data, nickname, tableMetaData });
});

app.get("/get_table_body", (req, res) => {
  const { userId } = req.session;

  if (!userId) {
    res.redirect("/");
  }

  const { direction, colVal } = req.query;
  const th = tableMetaData.find((obj) => obj.id === colVal);
  th.sortClass = "sort-asc";
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
