const PlayerTracker = require('./PlayerTracker');

function UserFantasyScoreTracker(userId, eventId, players) {
  let obj = {
    userId,
    eventId,
    players,
    get totalFantasyPoints() {
      let keys = Object.keys(this.playerTotals);
      if (!keys) return 0;
      return keys.reduce(
        (prev, cur) => prev + this.playerTotals[cur].totalScore,
        0
      );
    },
    playerTotals: {},
  };
  obj.players.forEach((p) => {
    let curPlayer = PlayerTracker(p, eventId);
    obj.playerTotals[p] = curPlayer;
  });
  return obj;
}

module.exports = UserFantasyScoreTracker;
