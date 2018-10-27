import React, {Component} from 'react';
import ProgressBar from "./ui/ProgressBar";
/*

Progress bar with numbers at each end of the bar..
 */
/* props to pass :
# exp info
- expFrom
- expTo

# level from
- levelFromIdx (start with 0 index)
- levelFromThreshold (highest exp for that level)
- levelFromStart (highest exp for that level)

# level to
- levelToIdx (start with 0 index)
- levelToThreshold (highest exp for that level)
- levelToStart (highest exp for that level)

// options to configure (with defaults):
initialDelayMs: 500,
tickMs:20 , // per tickMs, update the progressBar.
pgbarExpInterval : 20, // per tickMs, increment Exp by pgbarExpInterval
levelingUpMs: 1100 // delay time when leveling up so we can do effects (e.g. level bar flashing)
 */
class ExpUpdateProgressBar extends Component{
    state={
        percentage: 100 * (this.props.expFrom - this.props.levelFromStart) / (this.props.levelFromThreshold - this.props.levelFromStart ),
        level: this.props.levelFromIdx + 1,
        exp: this.props.expFrom,
        isLevelingUp: false,
        levelingUpElapsedMs : 0,

        // options to configure:
        initialDelayMs: this.props.initialDelayMs? this.props.initialDelayMs: 500,
        tickMs: this.props.tickMs? this.props.tickMs:20 , // per tickMs, update the progressBar.
        pgbarExpInterval: this.props.pgbarExpInterval? this.props.pgbarExpInterval: 20, // per tickMs, increment Exp by pgbarExpInterval
        levelingUpMs: this.props.levelingUpMs? this.props.levelingUpMs:1100 // delay time when leveling up so we can do effects (e.g. level bar flashing)

    }
    constructor(props){
        super(props);
    }
    componentDidMount(){
        console.log("this.state: ",this.state)
        console.log("this.props:",this.props);
        let timeout = setTimeout(()=>{
            this.setState({interval: setInterval(()=>{
                    //console.log("running interval setstate for percentage: ",this.state.percentage)
                    if (this.state.isLevelingUp){
                       // console.log("is leveling up fornow. Tick: ",this.state.levelingUpElapsedMs)

                        this.setState(prevState=>({
                            levelingUpElapsedMs: prevState.levelingUpElapsedMs + this.state.tickMs
                        }),()=>{
                            if(this.state.levelingUpElapsedMs >= this.state.levelingUpMs){
                                this.setState(prevState=>({
                                    isLevelingUp: false,
                                    level:prevState.level + 1,
                                    percentage: 0,
                                    exp : prevState.level + 1 === this.props.levelTo + 1 ? this.props.levelToStart: prevState.exp // for exp.
                                }));
                            }

                        });
                    }else{
                        this.setState(
                            (prevState) => (
                                {exp: prevState.exp + this.state.pgbarExpInterval > this.props.expTo ? this.props.expTo : prevState.exp + this.state.pgbarExpInterval})
                            , () => {
                                if(this.state.level === this.props.levelFromIdx + 1){
                                    // STILL IN levelFrom level.
                                    this.setState({
                                        percentage: 100 * ((this.state.exp  - this.props.levelFromStart ) / (this.props.levelFromThreshold - this.props.levelFromStart))
                                    })

                                }else if (this.state.level === this.props.levelToIdx + 1) {
                                    // in levelTo level.
                                    this.setState({
                                        percentage: 100 * ((this.state.exp  - this.props.levelToStart ) / (this.props.levelToThreshold - this.props.levelToStart))
                                    })

                                }else{
                                    // in between.
                                    this.setState(prevState =>({
                                        percentage: prevState.percentage + (this.props.percentageInterval? this.props.percentageInterval : 2)
                                    }))
                                }
                                if (this.state.exp === this.props.expTo){
                                    // end position. Stop.
                                    clearInterval(this.state.interval);
                                    return;
                                }
                                // now check if percentage is 100 %.
                                if(this.state.percentage >= 99){
                                    this.setState(prevState=>({
                                        isLevelingUp : true,
                                        levelingUpElapsedMs: 0
                                    }))
                                }
                            });
                    }
                },this.state.tickMs)})
        },this.state.initialDelayMs);
        this.setState({timeout})
    }
    componentWillUnmount(){
            clearInterval(this.state.interval);
            clearTimeout(this.state.timeout)
    }

    render(){
        return (
            <div style={{display:'flex',flexDirection:"column", alignContent:"center"}}>

                <div style={{display: 'flex',flexDirection:"row",alignItems:"center",justifyContent:"space-between"}}>
                    <h1> Lvl. {this.state.level}</h1>
                    {this.state.level !== this.props.levelToIdx + 1 || this.props.levelToThreshold ?
                        <h1> Lvl. {this.state.level + 1}</h1>
                    :undefined}
                </div>
            <ProgressBar
                height={"27px"}
                color={"rgba(94, 220, 58, 0.93)"}
                percentage={this.state.level === this.props.levelToIdx + 1 && !this.props.levelToThreshold?
                    100:
                    Math.min(this.state.percentage,100)}
                isFlashing={this.state.isLevelingUp}
            />
            </div>
        )
    }
}
export default ExpUpdateProgressBar;
