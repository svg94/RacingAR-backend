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
const Session = require("./models/session");
/*const socket = require('socket.io');
const io = new socket();
io.listen(process.env.PORT || 3000);*/

const dbConnection = "mongodb://localhost:27017";
mongoose.connect(dbConnection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
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
const clientIntervals = {}; //Nutzen wir, um die Intervalle global zu "speichern", damit wir sie im disconnect fall clearen können.
io.on('connection', (client) => {
    console.log("connected");

    client.on('keydown', handlePlayerMovement);
    client.on('newGame', handleNewGame);
    client.on('joinGame',handleJoinGame);
    client.on('startAR',handleStartAR);
    client.on('collision',handleCollision);
    client.on('disconnect', async ()=>{
        console.log("DISCONNECT", client.id);
        let session = await Session.findOne({'players.socketId': client.id});
        if(session){
            let gameCode = session.gameCode;
            if(clientIntervals[gameCode]){
                let intervalToClear = clientIntervals[gameCode].obstacleInterval;
                clearInterval(intervalToClear);

                intervalToClear = clientIntervals[gameCode].gameLoopInterval;
                clearInterval(intervalToClear);

                clientIntervals[gameCode] = null;
                console.log("Spiel beendet");
            }
        }

        //         let disconnectedPlayer = players.filter(player => player.socketId !== socket.id);
//         players = players.filter(player => player.socketId !== socket.id);
//         io.sockets.emit("disconnectedPlayer", disconnectedPlayer);
//         console.log("------");
//         console.log('user'+disconnectedPlayer.name+' disconnected');
//         console.log(players);
//         console.log("------");
//     });
    });

    function handleJoinGame(gameCode){

        clientRooms[client.id] = gameCode;
        client.join(gameCode);
        client.number = 2;
        gameState[gameCode].players[1].socketId = client.id;
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
        gameState[roomName].players[0].socketId = client.id;
        client.join(roomName);
        client.number = 1;  //Player 1
        console.log("Player "+ client.number + " joined Room " + roomName);
        client.emit('playerNumber', 1);
    }

    function sendAllPlayersJoinedGameReady(roomName){
        const state = gameState[roomName];
        let test = "All Players joined the Room";
        io.sockets.in(roomName).emit('TestNachricht', test); //test wird später state

    }

    function handleStartAR(gameCode){
        //Dürfen nur ganze Zahlen von 0 bis 19 sein!
        let coords = {x:5,y:0,z:5};
        //io.sockets.in(gameCode).emit('TestBox', coords);
        clientIntervals[gameCode] = {obstacleInterval: null, gameLoopInterval: null};
        moveObjectsIntervall(gameCode)
        //Display Player
        let playersCoords = gameState[gameCode].players;
        io.sockets.in(gameCode).emit('DisplayPlayers', playersCoords);
        startGameInterval(gameCode);

        let gameSession = gameState[gameCode];
        gameSession.gameCode = gameCode;
        let session = new Session(
            gameSession
        );
        session.save().then();

    }
    function handleCollision(data){
        console.log("Collision")
        console.log(data.gameCode);
        console.log(data.playerNumber);
        console.log("Collision End")
        if(!data.gameCode || !data.playerNumber){
            return;
        }
        if(data.playerNumber === 1){
            gameState[data.gameCode].winner = 2
        }else{
            gameState[data.gameCode].winner = 1
        }
    }
    async function handleDisconnect(client){
        console.log("DISCONNECT", client.id);
        let session = await Session.findOne({'players.socketId': client.id});
        console.log(session);
        //         let disconnectedPlayer = players.filter(player => player.socketId !== socket.id);
//         players = players.filter(player => player.socketId !== socket.id);
//         io.sockets.emit("disconnectedPlayer", disconnectedPlayer);
//         console.log("------");
//         console.log('user'+disconnectedPlayer.name+' disconnected');
//         console.log(players);
//         console.log("------");
//     });
    }

    function moveObjectsIntervall(gameCode){

        clientIntervals[gameCode].obstacleInterval = setInterval(()=>{
            const winner =  gameState[gameCode].winner;
            if(!winner){
                //Move obstacles
                obstacleLoop(gameState[gameCode]);
                io.sockets.in(gameCode).emit('moveObstacles', gameState[gameCode].obstacles);
            }else{
                console.log("Winner",winner);
                //emitGameOver(gameCode, winner);
                //gameState[gameCode] = null;
                clearInterval(clientIntervals[gameCode].obstacleInterval);
            }
        }, 1000);
    }




    function startGameInterval(roomName){
        clientIntervals[roomName].gameLoopInterval = setInterval(async ()=>{
            const winner = gameLoop(gameState[roomName]);

            if(!winner){
                //client.emit('gameState',JSON.stringify(gameState));
                await Session.deleteOne({gameCode: roomName});
                let gameSession = gameState[roomName];
                gameSession.gameCode = roomName;
                let currentSession = new Session(gameSession);
                await currentSession.save(currentSession);
                emitGameState(roomName, gameState[roomName]);
            }else{
                //emitGameOver(roomName, winner);
                //gameState[roomName] = null;
                console.log("Ende");
                clearInterval(clientIntervals[roomName].gameLoopInterval);
            }
        }, 1000 / FRAME_RATE);

        //moveObjectsIntervall(roomName);
    }

    function handlePlayerMovement(playerCoords) {
        const roomName = clientRooms[client.id];
        if (!roomName) {
            return;
        }

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

