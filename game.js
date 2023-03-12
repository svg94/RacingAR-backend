module.exports = {
    initGame,
    gameLoop,
    getUpdatedVelocity,
}

function initGame() {
    const state = createGameState()
    randomFood(state);
    return state;
}

function createGameState() {
    return {
        players: [
            {
                pos: {
                    x: 3,
                    y: 10,
                    z: 4
                },
            },
            {
                pos: {
                    x: 18,
                    y: 10,
                    z: 4
                }
            }
        ],
        obstacles:[
            {
                pos: {
                    x: 18,
                    y: 10,
                    z: 4
                },
                active: false
            },
        ]
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

function playerHitObstacles(player, state){
    //check collision for player
    //if collision then return true
    return false;
}