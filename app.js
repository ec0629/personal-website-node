const http = require("node:http");
const PORT = 3000;

http.createServer(function (req, res) {
    res.write("On the way to being a full stack engineer!");
    res.end();
}).listen(PORT, () => {
    console.log(`Server started on port ${PORT}.`);
});