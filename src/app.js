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
  getLeagueDraftData,
  getUsersLeaguesAndTeams,
  getYahooAuthorizationUrl,
  getYahooOAuthConfig,
  requestYahooAccessToken,
  verifyYahooJwtAndDecode,
} from "./services/yahooAPIService.js";
import {
  getDraftData,
  hasLeagueData,
  insertDraftData,
} from "./repositories/draftRepo.js";

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

    const { tokens } = user;
    const client = oauth.buildOAuthClient(getYahooOAuthConfig(), tokens);
    const leagues = await getUsersLeaguesAndTeams(client);

    return res.render("leagues", { leagues });
  })
);

app.get(
  "/league/:leagueKey/dashboard",
  asyncWrapper(async (req, res) => {
    const { user } = req.session;

    if (!user) {
      return res.redirect("/");
    }

    const { leagueKey } = req.params;

    let leagueDraftData;
    if (hasLeagueData(leagueKey)) {
      leagueDraftData = getDraftData(leagueKey);
    } else {
      const { tokens } = user;
      const client = oauth.buildOAuthClient(getYahooOAuthConfig(), tokens);
      const apiData = await getLeagueDraftData(leagueKey, client);

      if (["draft", "postdraft"].includes(apiData.draftStatus)) {
        insertDraftData(apiData);
        leagueDraftData = getDraftData(leagueKey);
      }
    }

    leagueDraftData.draftPositionSet = Boolean(
      leagueDraftData.teams[0]?.draftPosition
    );

    leagueDraftData.draftLive = leagueDraftData.draftStatus === "draft";
    leagueDraftData.draftComplete = leagueDraftData.draftStatus === "postdraft";

    if (!leagueDraftData.draftPositionSet) {
      const countDownDate = new Date(leagueDraftData.draftTime).getTime();
      const now = new Date().getTime();
      const distance = countDownDate - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      leagueDraftData.countdownString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    const start = leagueDraftData.draftSelections.length;
    const stop =
      leagueDraftData.totalDraftRounds * leagueDraftData.teams.length;

    for (let i = start; i < stop; i += 1) {
      fullDraftBoard.push({
        pick: i + 1,
        player: null,
      });
    }

    const numTeams = leagueDraftData.teams.length;

    const fullDraftBoard = [];

    for (let i = 0; i < stop; i += numTeams) {
      const round = i / numTeams + 1;
      const temp = leagueDraftData.draftSelections.slice(i, i + numTeams);
      temp.unshift({ roundCard: `Round: ${round}` });
      fullDraftBoard.push(temp);
    }

    leagueDraftData.draftSelections = fullDraftBoard;

    return res.render("dashboard", leagueDraftData);
  })
);

app.get("/league/:leagueKey/big-board", (req, res) => {
  const { user } = req.session;

  if (!user) {
    return res.redirect("/");
  }

  const th = tableMetaData.find((obj) => obj.id === "etr_rank");
  th.sortClass = "sort-asc";
  const playerData = getPlayerRankingsAndADP(th.orderBy, "asc");
  return res.render("bigBoard", { playerData, tableMetaData });
});

app.get("/get-table-body", (req, res) => {
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
