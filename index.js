const express = require('express');
const https = require('https');
const fs = require('fs');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const {createRoomID} = require("./utils");
const {initGame, gameLoop} = require("./game");

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

const FRAME_RATE = 25;

app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(httpPort, () => {
    console.log(`Example app listening on port ${httpPort}`);
});

let server = https.createServer(options, app);
const io = new Server(server);

let players = [];
const gameState = {};
const clientRooms = {};

io.on('connection', (client) => {
    client.on('newGame', handleNewGame);
    client.on('joinGame',handleJoinGame);
    function handleNewGame(){
        //Create a new socket.io Room
        let roomName = createRoomID();
        clientRooms[client.id] = roomName;
        client.emit('gameCode', roomName);

        gameState[roomName] = initGame();

        client.join(roomName);
        client.number = 1;  //Player 1
        client.emit('init', 1);
    }
    function handleJoinGame(gameCode){
        const room = io.sockets.adapter.rooms[gameCode];

        let allUsers;
        if(room){
            allUsers = room.sockets;
        }

        let numberClients = 0;
        if(allUsers){
            numberClients = Object.keys(allUsers).length;
        }
        if(numberClients === 0){
            client.emit('unkownGame');
            return;
        }else if(numberClients > 1){
            client.emit('tooManyPlayers');
            return;
        }

        clientRooms[client.id] = gameCode;
        client.join(gameCode);
        client.number = 2;
        client.emit('init', 2);

        startGameInterval(gameCode);
    }
    function startGameInterval(roomName){
        //Video timestamp 58:20
        const intervalId = setInterval(()=>{
            const winner = gameLoop(gameState[roomName]);

            if(!winner){
                client.emit('gameState',JSON.stringify(gameState));
                emitGameState(roomName, gameState[roomName]);
            }else{
                emitGameOver(roomName, winner);
                gameState[roomName] = null;
                clearInterval(intervalId);
            }
        }, 1000 / FRAME_RATE);

        const intervalObstacles = setInterval(()=>{
            const winner = gameLoop(gameState[roomName]);

            if(!winner){
                //Move obstacles
                emitGameState(roomName, gameState[roomName]);
            }else{
                emitGameOver(roomName, winner);
                gameState[roomName] = null;
                clearInterval(intervalObstacles);
            }
        }, 1000);
    }

    function handlePlayerMovement(direction) {
        const roomName = clientRooms[client.id];
        if (!roomName) {
            return;
        }

        //Apply logic for movement

        const newPos = {x:2,y:2,z:2};

        gameState[roomName].players[client.number - 1].pos = newPos;
    }


    function emitGameState(roomName, state){
        io.sockets.in(roomName)
            .emit('gameState',JSON.stringify(state));
    }
    function emitGameOver(roomName, winner){
        io.sockets.in(roomName)
            .emit('gameOver',JSON.stringify(winner));
    }
});
// io.on('connection', (socket) => {
//     console.log("------");
//     console.log('a user connected', socket.id);
//     console.log("------");
//     console.log(players);
//     socket.on('join',(playerData)=>{
//         playerData.socketId = socket.id;
//         console.log(typeof playerData.socketId);
//         console.log("------");
//         console.log("Event Join");
//         console.log(playerData);
//         console.log("------");
//         players.push(playerData);
//         io.sockets.emit("join", playerData);
//     });
//     socket.on('joined',()=>{
//         console.log("------");
//         console.log("Event Joined:");
//         console.log(players);
//         console.log("------");
//        io.sockets.emit("joined", players);
//     });
//     //handles players status. Event broadcasts positions and if the user is alive (did not hit an obstacle)
//     socket.on('updatedPlayers',()=>{
//
//     });
//     socket.on('disconnect', () => {
//         let disconnectedPlayer = players.filter(player => player.socketId !== socket.id);
//         players = players.filter(player => player.socketId !== socket.id);
//         io.sockets.emit("disconnectedPlayer", disconnectedPlayer);
//         console.log("------");
//         console.log('user'+disconnectedPlayer.name+' disconnected');
//         console.log(players);
//         console.log("------");
//     });
//
//     socket.emit("introduction",()=>{
//
//     });
// });

server.listen(httpsPort, () => {
    console.log("https server starting on port : " + httpsPort);
});

