import React ,{Component}from 'react';
import PlayingCard from './ui/PlayingCard';
import ReactLoading from 'react-loading';
import {Row, Col,  Progress, Button, Tooltip } from 'antd';
import ProgressBar from "./ui/ProgressBar";
/* props:
gameplay - gameplay object.
myusername - my username
cardsuit - the cardsuit
slapped - whether the player him/herself has slapped.
loser - the loser of some match event.
isError - show "joining game...."
realnum - the card number face up on the pile right now.
 */
class GamePlayComponent extends Component{
    render(){
       return (
           <div>
                       <h4>it is {this.props.gameplay.playerinturn === this.props.myusername ? "your" : (this.props.gameplay.playerinturn + (this.props.gameplay.playerinturn.endsWith('s')? "'":"'s"))} turn.</h4>
                       <div>
                           {/* Pile */}
                           <h2>{this.props.gameplay.pile.length} card{this.props.gameplay.pile.length> 1? 's':''} in Pile</h2>
                           <ProgressBar
                               style={{margin:"0px 10px 10px 10px"}}
                               height={"30px"}
                               width={"100%"}
                               percentage ={
                                   (this.props.gameplay.pile.length /(
                                       this.props.gameplay.pile.length +
                                       this.props.gameplay.players.map((player)=>player.nhand).reduce((acc,cur)=>acc+cur) ))* 100}
                               format={()=>`pile: ${this.props.gameplay.pile.length}`}
                               fillerClassName={'fillerPile'}
                               color={this.props.gameplay.pile.length > 13?( this.props.gameplay.pile.length > 20? '#ff2643': '#ecbd10'):'#67d7f8'}
                               borderColor={"rgb(215,215,215)"}
                           />

                       </div>
                       <Row type="flex" justify="center" align="top">
                           <Col span={8}>
                               <div style={{ marginLeft: "10px"}}>
                                   {this.props.gameplay.players.map((player, idx) => {
                                       const bg = this.props.loser === player.username? "#ee4f34": (player.username === this.props.gameplay.playerinturn? "#4eaffc": "#FFFFFF");
                                       return (
                                           <div key={idx} style={{margin:'10px 25px 0px 25px' , padding: "20px 8px 20px 20px", border: "6px solid #F5F5F5",borderRadius:"20px" , background: bg, width: "80%"}}>
                                               <h2>{player.username}</h2>
                                               <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
                                                   <div>
                                                       <p> cards: {player.nhand} </p>
                                                       <p> score: {Math.round(player.score)} </p>
                                                       <p>{player.hasslapped ? `SLAPPED ${Math.round(player.slapreactiontime)}ms` : " "}</p>
                                                   </div>
                                                   <Progress
                                                       style={{marginLeft: '10px',height: "65%", width:"65%"}}
                                                       type="circle"
                                                       status={player.streak >= 3? 'success': 'active'}
                                                       percent={player.streak * 33.33333}
                                                       format={percent => `${player.streak} streak${player.streak > 1 ? 's':''}`}/>
                                               </div>
                                           </div>
                                       );
                                   })}
                               </div>
                           </Col>
                           <Col span={8}>
                               <Button onClick={this.props.throw} style={{margin:'5px 5px 5px 5px'}}>
                                   throw
                               </Button>
                               <Button onClick={this.props.slap} style={{margin:'5px 5px 5px 5px'}}>
                                   slap
                               </Button>
                               <Tooltip placement="top" title={"Press this button when your gameplay state is out of sync."}>
                                   <Button onClick={this.props.synchronize} style={{margin:'5px 5px 5px 5px'}}>
                                       synchronize
                                   </Button>
                               </Tooltip>
                               {this.props.gameplay.pile.length === 0 ? (<p>{this.props.gameplay.playerinturn}, throw the card to continue...`</p>) :
                                   (
                                       <PlayingCard
                                           suit={this.props.cardsuit}
                                           number={this.props.gameplay.pile[this.props.gameplay.pile.length - 1]}
                                           hasSlapped={this.props.slapped}
                                       />
                                   )
                               }
                           </Col>
                           <Col span={8}>
                        <span className={"showCounter"}>
                        <p className={"game_font"} style={{fontSize:'135px', textAlign:'center', marginTop:'100px'}}> {
                            this.props.realnum
                        }</p>
                        </span>
                           </Col>
                       </Row>
               </div>
       )
    }
}
export default GamePlayComponent;
