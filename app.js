const express = require("express");
const { Server: WebSocketServer } = require("ws");
const server = require("http").createServer();
const app = express();
const PORT = 3000;

app.get("/", function (req, res) {
    res.sendFile("index.html", { root: __dirname });
});

server.on("request", app);

server.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});


// Websocket
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    const numClients = wss.clients.size;

    console.log(`clients connected: ${numClients}`);

    wss.broadcast(`Current visitors: ${numClients}`);

    if (ws.readyState === ws.OPEN) {
        ws.send('Welcome!');
    }

    ws.on("close", () => {
        wss.broadcast(`Current visitors: ${wss.clients.size}`);
        console.log('A client has disconnected');
    });

    ws.on('error', () => {
        //
    });
});

wss.broadcast = (data) => {
    console.log(`Broadcasting: ${data}`);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};