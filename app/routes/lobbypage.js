var express = require('express');
var router = express.Router();
var fs = require('fs');
//let playersData = require('../tempData/playersData.json');
var bodyParser=require('body-parser');

//---------DEFINE ROUTES
router.get('/', function(req, res) {
          if (req.app.get('ingame') == true)
          {
                    res.writeHead(404,{"content-type":"text/plain"});
                    res.end(`a game is live now! You cannot join the current game. Please wait for the next available game`);
          }
          else
          {
                    console.log('client receiving:'+req.app.get('playersData'));
                      res.render('lobbypage', {
                                pageID: 'lobbypage',
                                url:req.app.get('url'),
                                playersdata:req.app.get('playersData')
                      });
          }
});
/***********SIGNAL FOR GAME START ******************/
router.post('/',function(req,res){
          //LATER: implement security of game start.
          let body="";
          req.on('data',(data)=>{body+=data;});
          req.on('end',function(){
                    if (body.split('=')[1] == 'ADMINUSER'){
                              console.log('gamestart signal posted.');

                              req.app.set('ingame',true);
                              let playersData=req.app.get('playersData');
                              let nPlayers = playersData.length;
                              req.app.set('nPlayers',nPlayers);
                              let cardDeck=[];
                              for (var i = 0; i < nPlayers + 3; i++){
                                        for(var j = 0; j < 13; j++)//13 is a king. 1 is an ace.
                                                  cardDeck.push(j+1);
                              }
                              let defaultStartingHand = 26;
                              playersData.forEach(function(player){
                                        player.hand=[];
                                        for(i =0; i <defaultStartingHand; ++i )
                                        player.hand.push( cardDeck.splice( Math.floor(Math.random() * (cardDeck.length)),1)[0]);
                              });
                              fs.writeFile(req.app.get('dataURI'), JSON.stringify(playersData), 'utf8', function(err) {
                                        if (err)
                                                 console.log(err);
                              });

                              req.app.set('playerInTurn', /*req.app.get('playersData')[*/Math.floor(Math.random()*req.app.get("playersData").length)/*].username*/);
                              req.app.set('counter',1);
                              req.app.get('io').emit('gamestart');
                              res.writeHead(200,{'content-type':'text/plain'});
                              res.end('SERVER RESPONSE: game starting. Setted cards, emmited \'gamestart\' event.')
                    }
                    else{
                              res.writeHead(200,{'content-type':'text/plain'});
                              res.end('SERVER RESPONSE: incorrect. Unable to authorize.');
                    }
          });


});


module.exports = router;
;
