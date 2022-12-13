const express = require('express');
const https = require('https');
const fs = require('fs');

const app = express();
const httpPort = 3000;
const httpsPort = 3001;

let key = fs.readFileSync(__dirname + '/certs/client-key.pem');
let cert = fs.readFileSync(__dirname + '/certs/client-cert.pem');
let options = {
    key: key,
    cert: cert
};

app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(httpPort, () => {
    console.log(`Example app listening on port ${httpPort}`);
});

let server = https.createServer(options, app);

server.listen(httpsPort, () => {
    console.log("https server starting on port : " + httpsPort);
});