function PlayerTracker(pdgaNum, eventId) {
  let obj = {
    pdgaNum,
    name: '',
    eventId,
    get placeFinished() {
      if (!this.rounds.length) return 0;
      return this.rounds[this.rounds.length - 1].place;
    },
    get placePoints() {
      if (!this.rounds.length) return 0;
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
