const rp = require('request-promise-native');
const fs = require('fs');
const calcFunctions = require('./utils/calcFunctions');
const testData = require('./data/testData');
const PlayerTracker = require('./utils/PlayerTracker');

const { eventId, players } = testData.Texas; // switch to other events for different results

// let playerTotals = {};
// players.forEach((p) => {
//   let curPlayer = PlayerTracker(p, eventId);
//   playerTotals[p] = curPlayer;
// });

// TODO: Create a User object that stores their tournament picks
// TODO: Create a separate player picker that is run based on the event

// TODO: Workflow:
/*
User picks Tournament and the other Users that will participate >
  A TournamentTracker is created which contains:
  1. an array of UserFantasyScoreTracker
  2. getter for Placement
  3. getters for other stats: isTournamentComplete, etc
*/

// TODO: Remove playerTotals from global scope
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

let currentUser = UserFantasyScoreTracker(1234, eventId, players);

async function getPerRoundScores(eventId, round, eventName, totalRounds) {
  let curRound = round > 3 ? 'Finals' : round;
  let isFinalRound = round === totalRounds.length;
  console.log(eventName);
  console.log(`Event ID: ${eventId}`);
  console.log(`Round: ${curRound}`);
  console.log('Making API Request...');
  // request the data from the JSON API
  const results = await rp({
    uri: `https://www.pdga.com/apps/tournament/live-api/live_results_fetch_round.php?TournID=${eventId}&Division=MPO&Round=${curRound}`,
    headers: {
      Connection: 'keep-alive',
      authority: 'www.pdga.com',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36',
      Referer: `https://www.pdga.com/apps/tournament/live/event?eventId=${eventId}&division=MPO&view=Scores&round=${curRound}`,
    },
    json: true,
  });
  console.log('Got results!');
  const allScores = results.data.scores;

  const playerData = allScores.filter(
    (i) => currentUser.players.filter((p) => i.PDGANum == p).length > 0
  );

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
      curRound,
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

    currentUser.playerTotals[player.PDGANum].rounds.push(thisRoundFantasyScore);
    currentUser.playerTotals[player.PDGANum].name = player.Name;

    if (isFinalRound) {
      console.log(
        `${player.Name} - Total Score: `,
        currentUser.playerTotals[player.PDGANum].totalScore
      );
      console.log(JSON.stringify(currentUser, null, 2));
    }
  });

  await sleep(500);
  // save the JSON to disk
  await fs.promises.writeFile(
    'output.json',
    JSON.stringify(currentUser, null, 2)
  );
  console.log('Done!');
}

// start the main script
main();

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function main() {
  let { data: eventData } = await getEventData(eventId);
  let eventName = eventData.SimpleName;

  let isEventFinals = eventData.Finals === 'yes'; // In 4 round events, the "Finals" are the 4th round.
  let totalRounds = Array.from(
    { length: isEventFinals ? 4 : 3 },
    (_, i) => i + 1
  );

  for (const round of totalRounds) {
    console.log(`Fetching Round ${round} data...`);
    await getPerRoundScores(eventId, round, eventName, totalRounds);
  }
}

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

  return results;
}
