# The Tepuk Nyamuk game

## What is it?

Tepuk nyamuk is an indonesian card game which is very fun to play!. How it works is as follows:
* Everyone gets given out a personal pile of cards. They are not to look at their own pile, and must be faced down.
* Players count in order (Ace to King) as they throw a single card to a central pile from their own pile.
* if the count matches the card's number, then everyone has to slap the central pile. The last person to slap this central pile has to get all the cards from the center.
* First person to finish their own pile, and successfuly slaps three times wins!


### controls

press `t` to throw a card from your own pile, and `space` to slap the center pile. Careful not to slap the center pile unless the card and counter matches!

## How to run a demo
Because this app uses the SOA methodology, you will have to fire up several things:
```sh
# be sure to have postgresql service started
# start the app central service
node appCentralService/app.js &

# start the game marshalling service (coming soon!)
node gameMarshallingSerivce/app.js & 

# run webpack development server for frontend
cd frontend && npm run dev-server
