const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let SessionSchema = new Schema({
    gameCode: {
        type: String
    },
    winner:{
        type: Number
    },
    players:[
        {
            number: {
                type: Number,
            },
            socketId:{
                type: String
            },
            pos:{
                x:{
                    type: Number
                },
                z:{
                    type: Number
                }
            },
        }
    ],
    obstacles:[
        {
            pos: {
                x:{
                    type: Number
                },
                y:{
                    type: Number
                },
                z:{
                    type: Number
                }
            },
            active: {
                type: Boolean
            },
            id: {
                type: Number
            }
        }
    ]
});


module.exports = mongoose.model('Session', SessionSchema);
