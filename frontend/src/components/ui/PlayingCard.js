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
    switch (parseInt(props.number)) {
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
            let num = props.number;
            if (num)
                rank = num.toString();
            break
    }
    if(!rank)
        return (
            <p> INVALID CARD. number not defined.</p>
        );
    return (
        <div>
            {props.hasSlapped?
                (
            <img src="/mosquito-zapper.png" style={{zIndex:2, position:'absolute', marginTop: '50px'}}
                 width="550px"
                 height={"550px"}
            />
                )
                :null}
                <div style={{position:'relative'}}>
            <Card rank={rank} suit={props.suit}/>
                </div>
        </div>
    );
};

export default PlayingCard;








