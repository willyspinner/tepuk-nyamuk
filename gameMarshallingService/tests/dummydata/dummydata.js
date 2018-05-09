module.exports= {
    // game1 is for immediate redis testing
  game1:{
      players:['p1','p2','p3','p4','p5'],
      cardsperplayer: 10,
      gamesessionid: 'samplesessionid',
  },
    // this is for gmsapp.test testing. (WS endpoints and http routes of gms)
    gameGMStest: {
      players: ['player1','player2','player3'],
        gameid: "09d7e456-6fd8-4091-898b-54f467505240",
        gamename: 'willysgame',
    }
};