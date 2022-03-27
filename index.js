const rp = require('request-promise-native');
const fs = require('fs');

async function main(eventId, round, eventName = '') {
  await getEventScores(eventId, round, eventName);
}

async function getEventScores(eventId, round, eventName) {
  console.log(eventName);
  console.log(`Event ID: ${eventId}`);
  console.log(`Round: ${round}`);
  console.log('Making API Request...');
  // request the data from the JSON API
  const results = await rp({
    uri: `https://www.pdga.com/apps/tournament/live-api/live_results_fetch_round.php?TournID=${eventId}&Division=MPO&Round=${round}`,
    headers: {
      Connection: 'keep-alive',
      authority: 'www.pdga.com',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36',
      Referer: `https://www.pdga.com/apps/tournament/live/event?eventId=${eventId}&division=MPO&view=Scores&round=${round}`,
    },
    json: true,
  });
  console.log('Got results!');
  const allScores = results.data.scores;

  const playerData = allScores.filter(
    (i) => players.filter((p) => i['PDGANum'] == p).length > 0
  );

  let fantasyScores = [];

  console.log('Round scores:');
  playerData.forEach((player) => {
    let scores = player.Scores.split(',').filter((i) => i != '');
    let pars = player.Pars.split(',');
    let place = player.RunningPlace;
    let placePoints = calculatePlacementScore(place);

    const {
      perHoleTotal,
      isBogeyFree,
      birdieStreak,
      birdieStreakPoints,
      numOfBirdieStreaks,
      birdieData,
    } = scores.reduce(
      (prev, cur, idx) => {
        let currentHoleScore = calculatePerHoleScore(
          parseInt(pars[idx]),
          parseInt(cur)
        );

        const {
          currentBirdieStreak,
          currentNumOfBirdieStreaks,
          currentBirdieStreakPoints,
        } = calculateBirdieStreakPoints(
          currentHoleScore,
          prev.birdieStreak,
          prev.numOfBirdieStreaks,
          prev.birdieStreakPoints
        );

        return {
          perHoleTotal: prev.perHoleTotal + currentHoleScore,
          isBogeyFree: currentHoleScore > 0,
          birdieStreak: currentBirdieStreak,
          birdieStreakPoints: currentBirdieStreakPoints,
          numOfBirdieStreaks: currentNumOfBirdieStreaks,
        };
      },
      {
        perHoleTotal: 0,
        isBogeyFree: true,
        birdieStreak: 0,
        birdieStreakPoints: 0,
        numOfBirdieStreaks: 0,
      }
    );

    let bogeyFreePoints = isBogeyFree ? 3 : 0;

    let thisRoundFantasyScore = {
      name: player.Name,
      eventId,
      round,
      place,
      placePoints,
      perHoleTotal,
      birdieStreakPoints,
      numOfBirdieStreaks,
      isBogeyFree,
      bogeyFreePoints,
      totalScore:
        placePoints + perHoleTotal + birdieStreakPoints + bogeyFreePoints,
    };

    console.log(thisRoundFantasyScore);
    fantasyScores.push(thisRoundFantasyScore);
    // TODO:
    //    - Per hole scoring  - Calculate on the fly, map against object
    //    - Bonus points  - Calculate on the fly
    //    - Handle if player DNF or did not play?
  });

  // save the JSON to disk
  await fs.promises.writeFile(
    'output.json',
    JSON.stringify(fantasyScores, null, 2)
  );
  console.log('Done!');
}

function calculatePlacementScore(place) {
  if (place > 50) return 0;
  let placementPointsKeys = Object.keys(placementPoints);
  for (const key of placementPointsKeys) {
    if (parseInt(key) >= place) {
      return placementPoints[key];
    }
  }
}

function calculatePerHoleScore(par, holeScore) {
  let scoreToPar = (par - holeScore) * -1;
  if (holeScore == 1 || scoreToPar <= -3) return 20; // incredible!!
  if (scoreToPar >= 2) return -1; // ouch.
  else {
    return perHoleScoringPoints[scoreToPar];
  }
}

function calculateBirdieStreakPoints(
  currentHoleScore,
  prevBirdieStreak,
  prevNumOfBirdieStreaks,
  prevBirdieStreakPoints
) {
  let currentBirdieStreak = prevBirdieStreak;
  let currentNumOfBirdieStreaks = prevNumOfBirdieStreaks;
  let currentBirdieStreakPoints = prevBirdieStreakPoints;

  if (currentHoleScore >= 3) {
    currentBirdieStreak = currentBirdieStreak + 1;
  } else {
    currentBirdieStreak = 0;
  }
  if (currentBirdieStreak >= 3) {
    currentBirdieStreakPoints = prevBirdieStreakPoints + 3;
    currentNumOfBirdieStreaks = currentNumOfBirdieStreaks + 1;
  }
  return {
    currentBirdieStreak,
    currentNumOfBirdieStreaks,
    currentBirdieStreakPoints,
  };
}

// Waco
const eventName = 'Waco';
const eventId = 55582;
// McBeth, Dickerson, Wysocki, Jones
const players = [27523, 62467, 38008, 41760];
// round options: 1, 2, 3, 'Finals'
const round = '3';

// LVC
// const eventName = 'Las Vegas Challenge'
// const eventId = 55580;
// Gannon, Gibson, Eagle
// const players = [48346, 75412, 37817];

// round options: 1, 2, 3, 'Finals'
// const round = 'Finals';

// start the main script
main(eventId, round, eventName);

const placementPoints = {
  1: 30,
  2: 20,
  3: 18,
  4: 16,
  5: 14,
  6: 12,
  7: 10,
  8: 9,
  9: 8,
  10: 7,
  15: 6,
  20: 5,
  25: 4,
  30: 3,
  40: 2,
  50: 1,
};

const perHoleScoringPoints = {
  '-3': 20,
  '-2': 8,
  '-1': 3,
  0: 0.5,
  1: -0.5,
  2: -1,
};
