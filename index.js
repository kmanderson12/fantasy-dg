const rp = require('request-promise-native');
const fs = require('fs');
const calcFunctions = require('./utils/calcFunctions');
const testData = require('./data/testData');

const { eventId, round, eventName, players } = testData.Waco; // switch to other events for different results

async function main() {
  // await getEventData(eventId);
  await getPerRoundScores(eventId, round, eventName);
}

// TODO: Multiple rounds - Pull event data first, then fetch rounds based on "Finals" yes/no
// TODO: Only calculate placePoints during last round

async function getEventData(eventId) {
  console.log('Fetching Event Data...');
  // request the data from the JSON API
  const results = await rp({
    uri: `https://www.pdga.com/apps/tournament/live-api/live_results_fetch_event.php?TournID=${eventId}`,
    headers: {
      Connection: 'keep-alive',
      authority: 'www.pdga.com',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36',
      Referer: `https://www.pdga.com/apps/tournament/live/event?eventId=${eventId}&division=MPO&view=Scores`,
    },
    json: true,
  });
  console.log('Got Event results!');

  // save the JSON to disk
  await fs.promises.writeFile(
    `event-output-${eventId}.json`,
    JSON.stringify(results, null, 2)
  );
}

async function getPerRoundScores(eventId, round, eventName) {
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
    (i) => players.filter((p) => i.PDGANum == p).length > 0
  );

  let fantasyScores = [];

  console.log('Round scores:');
  playerData.forEach((player) => {
    let scores = player.Scores.split(',').filter((i) => i != '');
    let pars = player.Pars.split(',');
    let place = player.RunningPlace;
    let placePoints = calcFunctions.calculatePlacementScore(place);

    const {
      perHoleTotal,
      isBogeyFree,
      birdieStreak,
      birdieStreakPoints,
      numOfBirdieStreaks,
      birdieData,
    } = scores.reduce(
      (prev, cur, idx) => {
        let curHoleScore = calcFunctions.calculatePerHoleScore(
          parseInt(pars[idx]),
          parseInt(cur)
        );

        const {
          curBirdieStreak,
          curNumOfBirdieStreaks,
          curBirdieStreakPoints,
        } = calcFunctions.calculateBirdieStreakPoints(
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

// start the main script
main();
