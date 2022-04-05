const PlayerTracker = require('./PlayerTracker');

function UserFantasyScoreTracker(
  { userId, name },
  eventId,
  players,
  totalRounds
) {
  let obj = {
    userId,
    name,
    eventId,
    players,
    finishedPlace: 0,
    get totalFantasyPoints() {
      let keys = Object.keys(this.playerTotals);
      if (!keys) return 0;
      return (
        keys.reduce(
          (prev, cur) => prev + this.playerTotals[cur].totalScore,
          0
        ) + (this.finishedPlace === 1 ? 50 : 0)
      );
    },
    playerTotals: {},
  };
  obj.players.forEach((p) => {
    let curPlayer = PlayerTracker(p, eventId, totalRounds);
    obj.playerTotals[p] = curPlayer;
  });
  return obj;
}

module.exports = UserFantasyScoreTracker;
