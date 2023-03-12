const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let PlayerSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: false
    },
    socketId:{
        unique: true,
        required: false
    },
    position:{
        required: false
    },
    alive:{
        type: Boolean,
        required: false
    },
    isHost:{
        type: Boolean
    },
    score:{
        type: Number,
        required: false
    }
});

let ObstacleSchema = new Schema({
    position:{
        required: false
    }
})

let SessionSchema = new Schema({
    lobbyName: {
        type: String,
        unique: true,
        required: true
    },
    players:[{
        type: PlayerSchema
    }],
    obstacles:[{
        type: ObstacleSchema
    }]

});



module.exports = mongoose.model('Session', SessionSchema);
