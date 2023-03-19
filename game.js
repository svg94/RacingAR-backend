const {randomIntFromInterval} = require("./utils");
module.exports = {
    initGame,
    gameLoop,
    obstacleLoop
    //getUpdatedVelocity,
}

function initGame() {
    const state = createGameState()
    //randomFood(state);
    return state;
}

//Positionen gehen von 0 bis 19, weil das Brett in 20 Felder unterteilt ist (Obstacles [und Player] sind nämlich 0.05 breit und lang und das Brett ist 1 breit und lang. Dadurch ergibt sich 20).
function createGameState() {
    // Create Obstacles
    let obstacles = [];
    //40 ist konstante aus frontend. Größe ObjectPool
    for(let i = 0; i < 40; i++){
        obstacles.push({
            pos: {
                x: 0,
                y: 0,
                z: 0
            },
            active: false,
            id: i
        });
    }
    // Return created GameState
    return {
        winner: null,
        players: [
            {
                pos: {
                    x: 0.2,
                    z: 0.8
                },
                number: 1
            },
            {
                pos: {
                    x: 0.8,
                    z: 0.8
                },
                number: 2
            }
        ],
        obstacles
    };
}

function gameLoop(state) {
    if (!state) {
        return;
    }

    const playerOne = state.players[0];
    const playerTwo = state.players[1];

    // playerOne.pos.x += playerOne.vel.x;
    // playerOne.pos.y += playerOne.vel.y;
    //
    // playerTwo.pos.x += playerTwo.vel.x;
    // playerTwo.pos.y += playerTwo.vel.y;

    if (playerHitObstacles(playerOne, state)) {
        // Player Two wins
        return 2;
    }

    if (playerHitObstacles(playerTwo, state)) {
        // Player One wins
        return 1;
    }

    return false;
}
function obstacleLoop(state){
    let inactiveObjects = state.obstacles.filter(obj => !obj.active);
    let activeObjects = state.obstacles.filter(obj => obj.active);


    if (inactiveObjects.length > 0) {
        let randomElementNumber = randomIntFromInterval(0, inactiveObjects.length-1);

        let possibleObstacleXPositionLength= 19;
        inactiveObjects[randomElementNumber].pos.x = Math.floor(Math.random()*possibleObstacleXPositionLength);
        inactiveObjects[randomElementNumber].pos.z = 0;

        inactiveObjects[randomElementNumber].active = true;
    }
    if (activeObjects.length > 0) {
        activeObjects.forEach(obj => {
            obj.pos.z = obj.pos.z+1;

            if (obj.pos.z > 19) {
                obj.active = false;
            }
        });
    }
}

function playerHitObstacles(player, state){
    //check collision for player
    //if collision then return true
    return false;
}