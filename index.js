const fs = require('fs');
const {
  fetchEventData,
  fetchTournamentResultsByRound,
} = require('./utils/fetchFunctions');
const calcFunctions = require('./utils/calcFunctions');
const testData = require('./data/testData');
const TournamentTracker = require('./components/TournamentTracker');
const UserFantasyScoreTracker = require('./components/UserFantasyScoreTracker');

const { eventId } = testData.Texas; // switch to other events for different results

// TODO: Create a separate player picker that is run based on the event

// TODO: Workflow:
/*
User picks Tournament and the other Users that will participate >
  A TournamentTracker is created which contains:
  1. an array of UserFantasyScoreTracker
  2. getter for Placement
  3. getters for other stats: isTournamentComplete, etc
*/
// For TX States
const teamA = [38008, 45971, 15857, 69509]; // Ricky, Calvin, Barsby, Freeman (top 4)
const teamB = [17295, 33705, 75412, 27523]; // Conrad, BigJerm, Buhr, McBeth (next 4)
const teamC = [62467, 47472, 23844, 49885]; // Dickerson, EKeith, Willis II, Hancock (next 4)

let userList = [
  {
    userId: 'kmanderson12',
    name: 'Kyle Anderson',
    players: teamC,
  },
  {
    userId: 'beastbomb36',
    name: 'Jaylen Qualls',
    players: teamB,
  },
  {
    userId: 'joetubesocks',
    name: 'Joe Toussaint',
    players: teamA,
  },
];

let tourneyTracker = TournamentTracker(eventId);
userList.forEach((user) => {
  let userTracker = UserFantasyScoreTracker(user, eventId, user.players);
  tourneyTracker.users.push(userTracker);
});

async function getPerRoundScores(eventId, round, eventName, totalRounds) {
  let curRound = round > 3 ? 'Finals' : round;
  let isFinalRound = round === totalRounds.length;

  // console.log('Making API Request...');
  const { data: results } = await fetchTournamentResultsByRound(
    eventId,
    curRound
  );

  console.log('Got results!');
  const allScores = results.data.scores;

  // loop through each user
  tourneyTracker.users.forEach((currentUser) => {
    const playerData = allScores.filter(
      (i) => currentUser.players.filter((p) => i.PDGANum == p).length > 0
    );
    // loop through each user's player
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

      tourneyTracker.users.map((u) =>
        u.userId === currentUser.userId
          ? u.playerTotals[player.PDGANum].rounds.push(thisRoundFantasyScore)
          : u
      );
    }); // end user's player loop
  }); // end user loop

  await sleep(500);
  console.log(`
  -------------------------------
  ------- ROUND ${round} RESULTS -------
  -------------------------------
  `);
  tourneyTracker.users
    .sort((a, b) => b.totalFantasyPoints - a.totalFantasyPoints)
    .forEach((u, idx) => {
      console.log(`${idx + 1}. ${u.name} - Score: ${u.totalFantasyPoints}`);
    });
  console.log(`

  `);

  // save the JSON to disk
  if (isFinalRound) {
    await fs.promises.writeFile(
      'output.json',
      JSON.stringify(tourneyTracker, null, 2)
    );
  }
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

  console.log(eventName);

  for (const round of totalRounds) {
    console.log(`Fetching Round ${round} data...`);
    await getPerRoundScores(eventId, round, eventName, totalRounds);
  }
}

async function getEventData(eventId) {
  console.log('Fetching Event Data...');
  const { data: results } = await fetchEventData(eventId);
  console.log('Got Event results!');

  // save the JSON to disk
  await fs.promises.writeFile(
    `event-output-${eventId}.json`,
    JSON.stringify(results, null, 2)
  );

  return results;
}
