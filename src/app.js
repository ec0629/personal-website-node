import express from "express";
import path from "node:path";
import { engine } from "express-handlebars";
import { notFound } from "@hapi/boom";
import { getDirName } from "./utils";

const __dirname = getDirName(import.meta.url);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/", function (req, res) {
  res.render("home", { title: "JeffSimonitto.com" });
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
