// all the fields we use in our postgres db.

module.exports = {
    //for each user
    USERS: {
        TABLENAME: 'USERS',
        TABLE:`USERS(USERNAME,SOCKETID, GAMEID`,
        USERNAME:'USERNAME', // their username
        SOCKET_ID: 'SOCKETID', // their socket id
        GAMEID: 'GAMEID', // the game id they are involved in, or null. - foreign key (into games table -- uuid)
    },
    //for each game
    GAMES: {
        TABLENAME: 'GAMES',
        TABLE:`GAMES(
            NAME,
            PLAYERS,
            UUID,
            STATUS,
            RESULT,
            CREATEDAT,
            CREATOR)`,
        NAME: 'NAME',
        PLAYERS: 'PLAYERS', // an array of player USERNAMES, - foreign key for USERS.
        UUID: 'UUID', // UUID OF GAME.
        STATUS: 'STATUS',// one of 'lob', 'prg' or 'end' (char(3))
        RESULT: 'RESULT', //JSON containing the result of the game.
        CREATEDAT: 'CREATEDAT', // unix time of when it was created.
        CREATOR: 'CREATOR' // username of who created the game. - foreign key for USERS
    }

}