const constants = require('./constants');

function calculatePlacementScore(place, isFinalRound) {
  if (!isFinalRound || place > 50) return 0;
  let placementPointsKeys = Object.keys(constants.PLACEMENT_POINTS);
  for (const key of placementPointsKeys) {
    if (parseInt(key) >= place) {
      return constants.PLACEMENT_POINTS[key];
    }
  }
}

function calculatePerHoleScore(par, holeScore) {
  let scoreToPar = (par - holeScore) * -1;
  if (holeScore == 1 || scoreToPar <= -3) return 20; // incredible!!
  if (scoreToPar >= 2) return -1; // ouch.
  return constants.PER_HOLE_SCORING_POINTS[scoreToPar];
}

function calculateBirdieStreakPoints(
  curHoleScore,
  prevBirdieStreak,
  prevNumOfBirdieStreaks,
  prevBirdieStreakPoints
) {
  let curBirdieStreak = prevBirdieStreak;
  let curNumOfBirdieStreaks = prevNumOfBirdieStreaks;
  let curBirdieStreakPoints = prevBirdieStreakPoints;

  if (curHoleScore >= 3) {
    curBirdieStreak = curBirdieStreak + 1;
  } else {
    curBirdieStreak = 0;
  }
  if (curBirdieStreak === 3) {
    curBirdieStreakPoints = prevBirdieStreakPoints + 3;
    curNumOfBirdieStreaks = curNumOfBirdieStreaks + 1;
    curBirdieStreak = 0;
  }
  return {
    curBirdieStreak,
    curNumOfBirdieStreaks,
    curBirdieStreakPoints,
  };
}

module.exports = {
  calculatePlacementScore,
  calculatePerHoleScore,
  calculateBirdieStreakPoints,
};
