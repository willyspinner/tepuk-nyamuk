let express = require('express');
let reload = require('reload');
let app = express();
var fs = require('fs');


app.set('port', process.env.PORT || 3000 );
//oldApp.set('url',"http://localhost:3000");

//-----------SERVER listening----------------------------------------
var server = app.listen(app.get('port'), function() {
          console.log('Listening on '+app.get('host')+', port ' + app.get('port'));

          });

//------------------- RESET the players data, and then  serve it.--------------------------
fs.writeFile(app.get('dataURI'), '[]', 'utf8', function(err) {
          let playersData = require('./tempData/playersData.json');
          app.set('playersData',playersData);
          app.use(require('./routes/lobbypage'));
          app.use(require('./routes/game'));

          //***************************SOCKET FOR LOBBY & GENERAL *************************

          var io = require('socket.io')();
          app.set('io',io);
          io.attach(server);// NOTE: The socket, wherever it is, HAS TO BE CONNECTED TO THE URL OF THIS SERVER!!
          //This is because we are attaching the io server here.
          io.on('connection', function(socket) {
                     socket.on('iJoin', function(user) {
                                console.log(`${user.username} joined the room.`);
                                playersData.push({'username':user.username});//<---FIX. don't JSON stringify this!!
                                console.log(playersData);
                               fs.writeFile(app.get('dataURI'), JSON.stringify(playersData), 'utf8', function(err) {
                                         if (err)
                                                  console.log(err);
                                        });
                              io.emit('userJoin',{'username':user.username});
                     });
                    socket.on('iDisconnect',function(data){
                              console.log(`${data.username} disconnected from game room.`);
                              console.log(playersData);
                              //Find data's index in our array.
                              //TODO ---- This is an  O(n) deletion solution. Surely there's a more efficient way??
                              playersData.filter((player)=>(
                                  player.username != data.username
                                  )
                              );
                              fs.writeFile(app.get('dataURI'), JSON.stringify(playersData), 'utf8', function(err) {
                                        if (err)
                                                 console.log(err);
                                        io.emit('userDisconnect',data);
                                       });
                    });
                    app.set('io',io);

                    //**************************SOCKET FOR GAME *****************************************
                    app.set('counter',1);
                    app.set('pile',[]);

                    socket.on('iThrew',function(card){
                              app.get('pile').push(card['card']);
                              console.log(`pile: ${app.get('pile')}`);
                              //oldApp.set('pile',oldApp.get('pile').length); //fIX THIS WAS THE PROBLEM.
                                        console.log('counter: '+app.get('counter'));
                                        app.set('playerInTurn', (app.get('playerInTurn') + 1) % app.get('playersData').length);
                                        //Server updates datafirst
                                        playersData[card.playerIdx]['hand'].pop();
                                        fs.writeFile(app.get('dataURI'), JSON.stringify(playersData), 'utf8', function(err) {
                                                  if (err)
                                                            console.log(err);
                                                  //emit info to others.
                                                  io.emit('userThrew',{'username':card.username,
                                                                                         'card':card.card,
                                                                                         'left':card.left,
                                                                                         'previousIdx':card.playerIdx,
                                                                                         'playerInTurnIdx':app.get('playerInTurn')});
                                                  //-----------------On match --------------------------
                                                  if( card.card == app.get('counter')){
                                                            io.emit('match',{});
                                                            app.set('slappedUsers',[]);
                                                            app.set('counter',1);
                                                            //slappedUsers=[];
                                                            console.log('found a match. both r '+card.card);

                                                            /*socket.on('iSlap',function(data){
                                                                      console.log(`${data['username']} slapped.`);
                                                                      if (!slappedUsers.includes(data['username'])){
                                                                                slappedUsers.push(data['username']);
                                                                                console.log(slappedUsers.length == oldApp.get('nplayers')? "matchResult should be emitted now.":"" );
                                                                                if (slappedUsers.length == oldApp.get('nPlayers'))
                                                                                          io.emit('matchResult',{'loser':slappedUsers.pop(),
                                                                                                                        'nCards':oldApp.get('pile')+card['left'] });
                                                                      }
                                                            });*/
                                                  }

                                                  else{
                                                            app.set('counter',(app.get('counter')%13) +1);
                                                  }
                                        });

                    });
                    //POTENTIAL FIX.
                    //var slappedUsers=[];

                    socket.on('iSlap',function(data){
                              console.log(`${data['username']} slapped.`);
                              var idxDict={}
                              if (!app.get('slappedUsers').includes(data['username'])){
                                        idxDict[data['username']] = data['playerIdx'];
                                        app.get('slappedUsers').push(data['username']);
                                        console.log(app.get('slappedUsers').length == app.get('nplayers')? "matchResult should be emitted now.":`${app.get('slappedUsers').length} in slappedUsers` );

                                        if (app.get('slappedUsers').length == app.get('nPlayers'))
                                        {
                                                  var loser = app.get('slappedUsers').pop();
                                                  playersData.forEach((player)=>{
                                                            if (loser == player.username){
                                                                      Array.prototype.push.apply(player.hand, app.get('pile'));
                                                  }});
                                                  fs.writeFile(app.get('dataURI'), JSON.stringify(playersData), 'utf8', function(err) {
                                                            if (err)
                                                                      console.log(err);
                                                            io.emit('matchResult',{'loser':loser/*oldApp.get('slappedUsers').pop()*/,
                                                                                          'pile':app.get('pile')/*card['left']*/ });
                                                            app.set('pile',[]);//TODO CONCURRENCY ISSUE HERE. WHAT IF oldApp.set IS CALLED BEFORE oldApp.get()?
                                                            app.set('playerInTurn',idxDict[loser]);
                                                  });
                                        }
                              }
                    });
          });
          reload(server, app);
});
