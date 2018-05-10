export const addGame = ( game )=> ({
  type: 'ADD_GAME',
    game:{
        ...game,
        players:[game.creator]
    }
});
export const startAddGame = (expenseData = {}) => {

    return (reduxDispatch, getState) => {
        //TODO: send an axios POST req/res here
    };
}

export const removeGame = ({id} = {}) => { // ID MUST BE FILLED. NO DEFAULTS
    if( typeof id === 'undefined')
        return {};
    return {
        'type': 'REMOVE_EXPENSE',
        'id': id
    }

}

export const startRemoveGame = ({id}) => {
    return (reduxDispatch,getState) => {
        //TODO: send a DELETE request here
    };

};

export const joinGame = (uuid,username) => ({
    type :'JOIN_GAME',
    uuid,
    username
})
export const startJoinGame = (uuid,username) => {
    //returns a JS promise when game join is approved by server.
    return (reduxDispatch,getState) => {
        //TODO: send an axios POST to join
    reduxDispatch(joinGame(uuid,username));
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            resolve();
        },1000);

    })


    }
}
export const leaveGame = (uuid,username)=>({
    type:'LEAVE_GAME',
        uuid,
        username
});
export const startLeaveGame = (uuid,username) => {
    //returns a JS promise when game join is approved by server.
    return (reduxDispatch,getState) => {
        //TODO: send an axios POST to leave
        
        console.log(`dispatching leave game... from start leave game`);
        reduxDispatch(leaveGame(uuid,username));
        return new Promise((resolve,reject)=>{
            setTimeout(()=>{
                resolve();
            },1000);

        })


    }
}
