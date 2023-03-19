const express = require('express');
const https = require('https');
const fs = require('fs');
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const {createRoomID} = require("./utils");
const {initGame, gameLoop, obstacleLoop} = require("./game");
const Console = require("console");
const { BoxBufferGeometry} = require("three");
const { Mesh} = require("three");
const { MeshBasicMaterial} = require("three");

/*const socket = require('socket.io');
const io = new socket();
io.listen(process.env.PORT || 3000);*/

/*const dbConnection = "mongodb://localhost:27017";
mongoose.connect(dbConnection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connection to MongoDB successful'))
    .catch((err) => {
        console.log(dbConnection);
        console.error(err)
        process.exit()
    });*/

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

const FRAME_RATE = 15;

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
    console.log("connected");

    client.on('keydown', handlePlayerMovement);
    client.on('newGame', handleNewGame);
    client.on('joinGame',handleJoinGame);
    client.on('startAR',handleStartAR);

    function handleJoinGame(gameCode){

        clientRooms[client.id] = gameCode;
        client.join(gameCode);
        client.number = 2;
        console.log("Player "+ client.number + " joined Room " + gameCode);
        client.emit('playerNumber', 2);

        sendAllPlayersJoinedGameReady(gameCode);
    }

    function handleNewGame(){
        //Create a new socket.io Room
        let roomName = createRoomID();
        clientRooms[client.id] = roomName;
        //console.log(clientRooms[client.id]);
        client.emit('gameCode', roomName);

        gameState[roomName] = initGame();
        //console.log(gameState[roomName]);

        client.join(roomName);
        client.number = 1;  //Player 1
        console.log("Player "+ client.number + " joined Room " + roomName);
        client.emit('playerNumber', 1);
    }

    function sendAllPlayersJoinedGameReady(roomName){
        const state = gameState[roomName];
        let test = "Diese Testnachricht soll an alle Spieler im Raum gehen";
        io.sockets.in(roomName).emit('TestNachricht', test); //test wird später state

    }

    function handleStartAR(gameCode){
        //Dürfen nur ganze Zahlen von 0 bis 19 sein!
        let coords = {x:5,y:0,z:5};
        console.log(coords);
        //io.sockets.in(gameCode).emit('TestBox', coords);
        gameState[gameCode] = initGame();
        moveObjectsIntervall(gameCode)
        //Display Player
        let playersCoords = gameState[gameCode].players;
        io.sockets.in(gameCode).emit('DisplayPlayers', playersCoords);
        startGameInterval(gameCode);


    }

    function moveObjectsIntervall(gameCode){
        const intervalObstacles = setInterval(()=>{
            const winner =  gameState[gameCode].winner;
            console.log("loop");
            console.log("Winner",winner);

            if(!winner){
                //Move obstacles
                //Movement function
                console.log("Schicke Move Obstacles");
                obstacleLoop(gameState[gameCode]);
                io.sockets.in(gameCode).emit('moveObstacles', gameState[gameCode].obstacles);
            }else{
                emitGameOver(gameCode, winner);
                gameState[gameCode] = null;
                clearInterval(intervalObstacles);
            }
        }, 1000);
    }




    function startGameInterval(roomName){
        //Video timestamp 58:20
        const intervalId = setInterval(()=>{
            const winner = gameLoop(gameState[roomName]);

            if(!winner){
                //client.emit('gameState',JSON.stringify(gameState));
                emitGameState(roomName, gameState[roomName]);
            }else{
                emitGameOver(roomName, winner);
                gameState[roomName] = null;
                clearInterval(intervalId);
            }
        }, 1000 / FRAME_RATE);

        //moveObjectsIntervall(roomName);
    }

    function handlePlayerMovement(playerCoords) {
        const roomName = clientRooms[client.id];
        if (!roomName) {
            return;
        }
        console.log(playerCoords);
        //Apply logic for movement
        gameState[roomName].players[playerCoords.number - 1].pos = playerCoords.pos;
    }


    function emitGameState(roomName, state){
        io.sockets.in(roomName)
            .emit('gameState',state);
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

