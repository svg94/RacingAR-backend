const express = require('express');
const https = require('https');
const fs = require('fs');
const { Server } = require("socket.io");


const app = express();
const httpPort = 3000;
const httpsPort = 3001;

let key = fs.readFileSync(__dirname + '/certs/client-key.pem');
let cert = fs.readFileSync(__dirname + '/certs/client-cert.pem');
let options = {
    key: key,
    cert: cert,
    requestCert: false,
    rejectUnauthorized: false
};

app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(httpPort, () => {
    console.log(`Example app listening on port ${httpPort}`);
});

let server = https.createServer(options, app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.emit("introduction",()=>{

    });
});

server.listen(httpsPort, () => {
    console.log("https server starting on port : " + httpsPort);
});