const rp = require('request-promise-native');
const fs = require('fs');

async function main(eventId, round, eventName = '') {
  await getEventScores(eventId, round, eventName);
}

// TODO: Multiple rounds
// TODO: Only calculate placePoints during last round

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
        let curHoleScore = calculatePerHoleScore(
          parseInt(pars[idx]),
          parseInt(cur)
        );

        const {
          curBirdieStreak,
          curNumOfBirdieStreaks,
          curBirdieStreakPoints,
        } = calculateBirdieStreakPoints(
          curHoleScore,
          prev.birdieStreak,
          prev.numOfBirdieStreaks,
          prev.birdieStreakPoints
        );

        return {
          perHoleTotal: prev.perHoleTotal + curHoleScore,
          isBogeyFree: curHoleScore > 0 && prev.isBogeyFree,
          birdieStreak: curBirdieStreak,
          birdieStreakPoints: curBirdieStreakPoints,
          numOfBirdieStreaks: curNumOfBirdieStreaks,
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

    fantasyScores.push(thisRoundFantasyScore);
  });

  console.log(fantasyScores);

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
  return perHoleScoringPoints[scoreToPar];
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
  if (curBirdieStreak >= 3) {
    curBirdieStreakPoints = prevBirdieStreakPoints + 3;
    curNumOfBirdieStreaks = curNumOfBirdieStreaks + 1;
  }
  return {
    curBirdieStreak,
    curNumOfBirdieStreaks,
    curBirdieStreakPoints,
  };
}

// LVC
// const eventName = 'Las Vegas Challenge'
// const eventId = 55580;
// Gannon, Gibson, Eagle
// const players = [48346, 75412, 37817];

// round options: 1, 2, 3, 'Finals'
// const round = 'Finals';

// Waco
// const eventName = 'Waco';
// const eventId = 55582;
// McBeth, Dickerson, Wysocki, Jones
// const players = [27523, 62467, 38008, 41760];
// round options: 1, 2, 3, 'Finals'
// const round = '3';

// Texas
const eventName = 'Texas States';
const eventId = 55583;
// Dickerson, McBeth, Wysocki, Jones
const players = [62467, 27523, 38008, 41760];
// round options: 1, 2, 3, 'Finals'
const round = '2';

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
