import React from 'react';
import Card from 'react-playing-card';
/*
Playing Card component.

------Props---------:
suit: A suit must be an element in the set { S, H, C, D }, which stands for spades, hearts,
clubs and diamonds, respectively.

number: 1 to 13, representing Ace to King respectively.

 */
const PlayingCard = (props) => {
    let rank;
    switch (props.number) {
        case 1:
            rank = "A";
            break;
        case 11:
            rank = "J";
            break;
        case 12:
            rank = "Q";
            break;
        case 13:
            rank = "K";
            break;
        default:
            let num = props.number
            rank = num.toString()
            break
    }
    return (
        <Card rank={rank} suit={props.suit}/>
    );
};

export default PlayingCard;








