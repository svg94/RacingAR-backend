module.exports = {
    createRoomID
}

function createRoomID(){
    idLength = 5;
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789';

    for(let i = 0; i < idLength; i++){
        result+= characters.charAt(Math.floor((Math.random() * characters.length)));
    }
    return result;
}