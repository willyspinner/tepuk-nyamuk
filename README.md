# The Tepuk Nyamuk game
![](readmeStuff/title.png?raw=true "Title")
Live!
https://tepuknyamuk.com
## What is it?

Tepuk nyamuk, or 'Mosquito Slapping', is an indonesian card game which is very fun to play!  How it works is as follows:
* Everyone gets given out a personal pile of cards. They are not to look at their own pile, and must be faced down.
* Players count in order (Ace to King) as they throw a single card to a central pile from their own pile.
* if the count matches the card's number, then everyone has to slap the central pile. The last person to slap this central pile has to get all the cards from the center.
* First person to finish their own pile, and successfuly slaps three times wins!
![](readmeStuff/gameplay.png?raw=true "Gameplay")

## controls

press `t` to throw a card from your own pile, and `space` to slap the center pile. Careful not to slap the center pile unless the card and counter matches!

## How am I building it?
This project has four integral parts.
#### 1. React-web Front end
I am leveraging React-Web with redux's state change capabilities to make programming the game's UI easier. 
#### 2. Node.JS App Service (App Central Service)
Built using the express framework and Postgresql database, This service manages the registration of users, creation and deletion of games, joining and leaving of game lobbies, as well as controlling socket.io routes to update state in real time.
#### 3. Node.JS Game Marshalling Service 
This service is the gameplay server. By using redis as an in-memory DB to allow for lightning fast reads and writes, and socket.io to communicate bidirectionally with players, it manages the entirety of the tepuk-nyamuk games from start to finish.
#### 4. Nginx proxy
The proxy serves as a proxy for the App service and the Game service, as well as a server to serve the react frontend.
## Architecture
![](readmeStuff/architecture.png?raw=true "Title")

