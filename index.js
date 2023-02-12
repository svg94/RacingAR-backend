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

let players = [];
io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    console.log(players);
    socket.on('join',(playerData)=>{
        playerData.socketId = socket.id;
        console.log(playerData);
        players.push(playerData);
        io.sockets.emit("join", playerData);
    });
    socket.on('joined',()=>{
       io.sockets.emit("joined", players);
    });
    //handles players status. Event broadcasts positions and if the user is alive (did not hit an obstacle)
    socket.on('updatedPlayers',()=>{

    });
    socket.on('disconnect', () => {
        let disconnectedPlayer = players.filter(player => player.socketId !== socket.id);
        players = players.filter(player => player.socketId !== socket.id);
        io.sockets.emit("disconnectedPlayer", disconnectedPlayer);
        console.log('user disconnected');
        console.log(players);
    });

    socket.emit("introduction",()=>{

    });
});

server.listen(httpsPort, () => {
    console.log("https server starting on port : " + httpsPort);
});