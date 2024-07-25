const http = require("node:http");
const PORT = 3000;

http.createServer(function (req, res) {
    res.write("Testing my brand new script!!!");
    res.end();
}).listen(PORT, () => {
    console.log(`Server started on port ${PORT}.`);
});