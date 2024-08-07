#!/usr/bin/env node

// var debug = require('debug')('temp-express:server');
import http from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import app from "../src/app";

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  // debug('Listening on ' + bind);
  console.log(`Listening on ${bind}`);
}

// Websocket
const wss = new WebSocketServer({ server });

wss.on("connection", onWebSocketConnection);

function onWebSocketConnection(ws) {
  const numClients = wss.clients.size;

  console.log(`clients connected: ${numClients}`);

  broadcast(`Current visitors: ${numClients}`);

  checkReadyAndSend(ws, "Welcome!");

  ws.on("close", () => {
    wss.broadcast(`Current visitors: ${wss.clients.size}`);
    console.log("A client has disconnected");
  });

  ws.on("error", () => {
    //
  });
}

function broadcast(data) {
  console.log(`Broadcasting: ${data}`);
  wss.clients.forEach((client) => {
    checkReadyAndSend(client, data);
  });
}

function checkReadyAndSend(client, msg) {
  if (client.readyState === WebSocket.OPEN) {
    client.send(msg);
  }
}
