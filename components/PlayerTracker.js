function PlayerTracker(pdgaNum, eventId, totalRounds) {
  let obj = {
    pdgaNum,
    eventId,
    roundsInEvent: totalRounds.length,
    get roundsPlayed() {
      if (!this.rounds.length) return 0;
      return this.rounds.filter((round) => round.isRoundComplete).length;
    },
    get name() {
      if (!this.rounds.length) return '';
      return this.rounds[0].name; // eventually this will be set on initialization, but for now...
    },
    get placeFinished() {
      if (!this.rounds.length) return 0;
      return this.rounds[this.rounds.length - 1].place;
    },
    get placePoints() {
      if (!this.rounds.length) return 0; // TODO: Need to know if round has been played
      if (this.roundsPlayed != this.roundsInEvent) return 0; // TODO: Need to know if round has been played
      return this.rounds[this.rounds.length - 1].placePoints;
    },
    get perHoleTotal() {
      if (!this.rounds.length) return 0;
      return this.rounds.reduce((prev, cur) => prev + cur.perHoleTotal, 0);
    },
    get birdieStreaks() {
      if (!this.rounds.length) return 0;
      return this.rounds.reduce(
        (prev, cur) => prev + cur.numOfBirdieStreaks,
        0
      );
    },
    get birdieStreakPoints() {
      if (!this.rounds.length) return 0;
      return this.rounds.reduce(
        (prev, cur) => prev + cur.birdieStreakPoints,
        0
      );
    },
    get bogeyFreeRounds() {
      if (!this.rounds.length) return 0;
      return this.rounds.reduce(
        (prev, cur) => (cur.isBogeyFree ? prev + 1 : prev),
        0
      );
    },
    get bogeyFreePoints() {
      if (!this.rounds.length) return 0;
      return this.rounds.reduce((prev, cur) => prev + cur.bogeyFreePoints, 0);
    },
    get subTotalScore() {
      if (!this.rounds.length) return 0;
      return this.perHoleTotal + this.birdieStreakPoints + this.bogeyFreePoints;
    },
    get totalScore() {
      if (!this.rounds.length) return 0;
      return (
        this.placePoints +
        this.perHoleTotal +
        this.birdieStreakPoints +
        this.bogeyFreePoints
      );
    },
    rounds: [],
  };

  return obj;
}

module.exports = PlayerTracker;
