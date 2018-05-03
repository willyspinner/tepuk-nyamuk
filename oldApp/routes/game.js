var express = require('express');
var router = express.Router();

router.get('/game/:username', function(req, res) {
          if (req.app.get('ingame') == false){
                    res.writeHead(404,{"content-type":"text/plain"});
                    res.end(`a game is not live now! Please go to the lobby room to get into the game!`);
          }
          else{
                    console.log(`${req.app.get('playerInTurn')} is starting.`)
                    res.render('game', {
                     pageID: 'gamepage',
                     playersdata:req.app.get('playersData'),
                    player:req.params.username.split('=')[1],
                    url:req.app.get('url')/*+'/game'*/,
                    startingPlayerIdx:req.app.get('playerInTurn')
                    });
          }


});

module.exports = router;
