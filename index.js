const express = require('express');
const https = require('https');
const fs = require('fs');
const { Server } = require("socket.io");
const mongoose = require('mongoose');

const dbConnection = "mongodb://racing:racing-ar-2023@localhost:27017/?authMechanism=DEFAULT";
mongoose.connect(dbConnection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    auth: {
        username: process.env.COSMOSDB_USER,
        password: process.env.COSMOSDB_PASSWORD
    }
})
    .then(() => console.log('Connection to MongoDB successful'))
    .catch((err) => {
        console.log(dbConnection);
        console.error(err)
        process.exit()
    });

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
    console.log("------");
    console.log('a user connected', socket.id);
    console.log("------");
    console.log(players);
    socket.on('join',(playerData)=>{
        playerData.socketId = socket.id;
        console.log(typeof playerData.socketId);
        console.log("------");
        console.log("Event Join");
        console.log(playerData);
        console.log("------");
        players.push(playerData);
        io.sockets.emit("join", playerData);
    });
    socket.on('joined',()=>{
        console.log("------");
        console.log("Event Joined:");
        console.log(players);
        console.log("------");
       io.sockets.emit("joined", players);
    });
    //handles players status. Event broadcasts positions and if the user is alive (did not hit an obstacle)
    socket.on('updatedPlayers',()=>{

    });
    socket.on('disconnect', () => {
        let disconnectedPlayer = players.filter(player => player.socketId !== socket.id);
        players = players.filter(player => player.socketId !== socket.id);
        io.sockets.emit("disconnectedPlayer", disconnectedPlayer);
        console.log("------");
        console.log('user'+disconnectedPlayer.name+' disconnected');
        console.log(players);
        console.log("------");
    });

    socket.emit("introduction",()=>{

    });
});

server.listen(httpsPort, () => {
    console.log("https server starting on port : " + httpsPort);
});