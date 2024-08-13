import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import { getDirName } from "../src/utils.js";

export default function createServer(app) {
  if (app.get("env") === "development") {
    /**
     * Create HTTPS server.
     */

    console.log("Creating https server.");
    const __dirname = getDirName(import.meta.url);

    const options = {
      key: fs.readFileSync(path.join(__dirname, "certs", "key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "certs", "cert.pem")),
    };

    return https.createServer(options, app);
  } else {
    /**
     * Create HTTP server.
     */

    console.log("Creating http server.");
    return http.createServer(app);
  }
}
