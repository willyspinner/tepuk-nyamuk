# The Tepuk Nyamuk game

## What is it?

Tepuk nyamuk is an indonesian card game which is very fun to play!. How it works is as follows:
* Everyone gets given out a personal pile of cards. They are not to look at their own pile, and must be faced down.
* Players count in order (Ace to King) as they throw a single card to a central pile from their own pile.
* if the count matches the card's number, then everyone has to slap the central pile. The last person to slap this central pile has to get all the cards from the center.
* First person to finish their own pile, and successfuly slaps three times wins!


## controls

press `t` to throw a card from your own pile, and `space` to slap the center pile. Careful not to slap the center pile unless the card and counter matches!

## How am I building it?
This project has three parts.
#### 1. React-web Front end
I am leveraging React-Web with redux's state change capabilities to make programming the game's UI easier.
#### 2. Node.JS App Service (App Central Service)
Built using the express framework and Postgresql database, This service manages the registration of users, creation and deletion of games, joining and leaving of game lobbies, as well as controlling socket.io routes to update state in real time.
#### 3. Node.JS Game Service 
This service is the gameplay server. By using redis as an in-memory DB to allow for lightning fast reads and writes, and socket.io to communicate bidirectionally with players, it manages the entirety of the tepuk-nyamuk games from start to finish.
## How to run a demo
### requirements
* `redis-server`
* Postgresql
* node (>=v6.11.5)
* npm
* yarn
### configurations
app central service configs for postgresql :
```sh
echo "PG_USER=YOUR_USERNAME_HERE
PG_HOST=loacalhost
PG_DATABASE=YOUR_DB_NAME_HERE
PG_PASSWORD=YOUR_DB_PW_HERE
PG_PORT=YOUR_PORT_HERE
ENVIRON=test
PG_TRUNCATE=0" > appCentralService/.appcs.test.env;
```
### run instructions
Because this app uses the SOA architecture, you will have to fire up several things:
```sh
# install dependencies
cd appCentralService; npm install; 
cd ../frontend; yarn install; 
cd ../gameMarshallingService; npm install;


# start the app central service
# be sure to have postgresql service already started.
node appCentralService/app.js &


# start the game marshalling service (coming soon!)
# be sure to have redis started.
node gameMarshallingSerivce/gmsapp.js &


# run webpack development server for frontend
cd frontend && npm run dev-server
```
