// Riot API Data Fetching Project
const express = require('express'); 
const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

const riotApiKey = 'RGAPI-9d667901-3bd3-4a1d-8b0e-914f2e090465';

const leagueV4 = (tier, division, riotApiKey) => `https://euw1.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/${tier}/${division}?api_key=${riotApiKey}`;
const summonerV4 = (summonerId) => `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}?api_key=${riotApiKey}`;
const matchV5MatchId = (puuid) => `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&api_key=${riotApiKey}`;
const matchV5MatchData = (matchId) => `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotApiKey}`;
const accountV1byRiotId = (gameName, tagLine) => `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}?api_key=${riotApiKey}`
const ddragonChampionData = `https://ddragon.leagueoflegends.com/cdn/13.1.1/data/en_US/champion.json`; 

app.post('/api/league-data', async (req, res) => {
    const { apiKey, tier, division, limit } = req.body;
    const url = leagueV4(tier, division, apiKey);

    try {
        const response = await axios.get(url);
        const data = response.data.slice(0, limit); // Limit the number of entries

        // Return data as JSON
        res.json({ data });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching league data');
    }
});


app.post('/api/download-csv', async (req, res) => {
    const { data } = req.body;

    const csvWriter = createCsvWriter({
        path: './league_data.csv',
        header: Object.keys(data[0]).map(key => ({ id: key, title: key })),
    });

    await csvWriter.writeRecords(data);
    res.download('./league_data.csv');
});

/* app.get('/api/league/:tier/:division', async (req, res) => {
    try {
        const { tier, division } = req.params;
        const url = leagueV4(tier, division);
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching league data');
    }
}); */

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});