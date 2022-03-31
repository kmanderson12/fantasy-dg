function TournamentTracker(eventId) {
  let obj = {
    createdBy: 1234,

    // TODO: Add logic for ties.
    get leaderboard() {
      // check users array for top scores
      if (!this.users.length) return null;
      let sortedArr = this.users.sort(
        (a, b) => b.totalFantasyPoints - a.totalFantasyPoints
      );
      return this.users
        .sort((a, b) => b.totalFantasyPoints - a.totalFantasyPoints)
        .reduce((prev, cur, idx) => {
          let newObj = prev;
          newObj[idx + 1] = cur.name; // TODO: switch to userId when no longer using console.
          return newObj;
        }, {});
    },
    users: [],
  };

  return obj;
}

module.exports = TournamentTracker;
