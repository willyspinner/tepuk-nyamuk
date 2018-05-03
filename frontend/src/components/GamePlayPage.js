import React, {Component} from 'react';
import {connect} from 'react-redux';
import PlayingCard from './ui/PlayingCard';
class GamePlayPage extends Component{
    state={
        currentCardNum: 1,
        suit:"S"
    }

    constructor(props){
        super(props);
        setInterval(()=>{
            this.setState({
                currentCardNum: Math.floor( 1 + 13 * Math.random()),
                suit:["S","H","C","D"][Math.floor(4 * Math.random())]
            },()=>{
                console.log(`Changed to: ${this.state.currentCardNum} of ${this.state.suit}`);
            })
        },400);

    }
    render () {
        return (
            <div>
            <h1> Game play</h1>
            <PlayingCard
                suit={this.state.suit}
                number={this.state.currentCardNum}
                    />
            </div>

        );
    }
};

const mapStateToProps = (state)=>(
    {
        //TODO: How to connect this up with ws?
        games:
            state.games
    }

)


export default connect(mapStateToProps)(GamePlayPage);