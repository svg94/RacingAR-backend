const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let PositionPlayerSchema = new Schema({
    x: {
        type: Number
    },
    z:{
        type: Number
    }
});
let PositionObstaclesSchema = new Schema({
    x: {
        type: Number
    },
    y:{
        type: Number
    },
    z:{
        type: Number
    }
});
let PlayerSchema = new Schema({
    pos: {
        type: PositionPlayerSchema
    },
    number: 1
});

let ObstacleSchema = new Schema({
    position:{
        required: false,
        type: PositionObstaclesSchema
    },
    id: {
        type: Number
    },
    active:{
        type: Boolean
    }
})

let SessionSchema = new Schema({
    lobbyName: {
        type: String,
        unique: true,
        required: true
    },
    winner: {
        type: Number
    },
    players:[{
        type: PlayerSchema
    }],
    obstacles:[{
        type: ObstacleSchema
    }]

});

module.exports = mongoose.model('Session', SessionSchema);
