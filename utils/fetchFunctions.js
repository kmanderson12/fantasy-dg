const axios = require('axios');

async function fetchTournamentResultsByRound(eventId, round) {
  try {
    const res = await axios.get(
      `https://www.pdga.com/apps/tournament/live-api/live_results_fetch_round.php?TournID=${eventId}&Division=MPO&Round=${round}`,
      {
        headers: {
          Connection: 'keep-alive',
          authority: 'www.pdga.com',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36',
          Referer: `https://www.pdga.com/apps/tournament/live/event?eventId=${eventId}&division=MPO&view=Scores&round=${round}`,
        },
      }
    );
    return res;
  } catch (err) {
    console.error(err);
  }
}

async function fetchEventData(eventId) {
  try {
    const res = await axios.get(
      `https://www.pdga.com/apps/tournament/live-api/live_results_fetch_event.php?TournID=${eventId}`,
      {
        headers: {
          Connection: 'keep-alive',
          authority: 'www.pdga.com',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36',
          Referer: `https://www.pdga.com/apps/tournament/live/event?eventId=${eventId}&division=MPO&view=Scores`,
        },
      }
    );
    return res;
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  fetchEventData,
  fetchTournamentResultsByRound,
};
