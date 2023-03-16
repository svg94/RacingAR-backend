module.exports = {
    createRoomID,
    randomIntFromInterval
}

function createRoomID(){
    idLength = 1;
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';

    for(let i = 0; i < idLength; i++){
        result+= characters.charAt(Math.floor((Math.random() * characters.length)));
    }
    return result;
}
function randomIntFromInterval(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}