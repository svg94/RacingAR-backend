const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const { Server } = require("socket.io");


const app = express();
app.use(cors())
const httpPort = 3000;
const httpsPort = 3001;

app.use(function(req,res,next){
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept');
});

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
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(httpsPort, () => {
    console.log("https server starting on port : " + httpsPort);
});
