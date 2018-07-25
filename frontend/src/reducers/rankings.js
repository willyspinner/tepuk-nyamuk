
const rankingsReducer = (state = [], action) => {
  switch (action.type) {
      case 'UPDATE_RANKINGS':
          return [...action.rankings];

    default:
      console.log(`rankings REDUCER DEFAULTING STATE for action ${action.type}`);
      return state;
  }
};

export default rankingsReducer;
