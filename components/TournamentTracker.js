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
          let newArr = [];
          newArr.push(cur.userId);
          return [...prev, cur.userId];
        }, []);
    },
    users: [],
  };

  return obj;
}

module.exports = TournamentTracker;
