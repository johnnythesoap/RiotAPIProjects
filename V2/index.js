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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const leagueV4 = (tier, division, riotApiKey) => `https://euw1.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/${tier}/${division}?api_key=${riotApiKey}`;
const summonerV4 = (summonerId) => `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}?api_key=${riotApiKey}`;
const matchV5MatchIds = (puuid) => `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&api_key=${riotApiKey}`;
const matchV5MatchData = (matchId) => `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotApiKey}`;
const accountV1ByRiotId = (gameName, tagLine) => `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}?api_key=${riotApiKey}`
const ddragonChampionData = `https://ddragon.leagueoflegends.com/cdn/13.1.1/data/en_US/champion.json`; 

let championIdToNameMap = {};

const fetchChampionData = async () => {
    try {
        const response = await axios.get(ddragonChampionData);
        const champions = response.data.data;
        championIdToNameMap = Object.fromEntries(
            Object.values(champions).map(champion => [parseInt(champion.key), champion.name])
        );
        console.log("Champion data fetched successfully.");
    } catch (error) {
        console.error("Error fetching champion data:", error);
    }
};

fetchChampionData();

// Helper function to fetch account data and return puuid
const fetchAccountData = async (gameName, tagLine) => {
    const url = accountV1ByRiotId(gameName, tagLine);
    try {
        const response = await axios.get(url);
        return response.data.puuid; // Return only puuid
    } catch (error) {
        console.error('Error fetching account data:', error);
        throw new Error('Account data fetch failed');
    }
};

// Helper function to fetch match IDs by puuid
const fetchMatchIds = async (puuid) => {
    const url = matchV5MatchIds(puuid);
    try {
        const response = await axios.get(url);
        return response.data; // Return array of match IDs
    } catch (error) {
        console.error('Error fetching match IDs:', error.response ? error.response.data : error.message);
        throw new Error('Match ID fetch failed');
    }
};

// Helper function to fetch match data by match ID
const fetchMatchData = async (matchId) => {
    const url = matchV5MatchData(matchId);
    try {
        const response = await axios.get(url);
        return response.data; // Return the match data
    } catch (error) {
        console.error('Error fetching match data:', error.response ? error.response.data : error.message);
        throw new Error('Match data fetch failed');
    }
};

// Helper function to fetch match data by match ID
const fetchAllMatchData = async (matchIds) => {
    const matchData = [];
    for (const matchId of matchIds) {
        try {
            const data = await fetchMatchData(matchId);
            matchData.push(data);
            await delay(1200); // Adjust delay as needed (1.2 seconds per request)
        } catch (error) {
            console.error(`Failed to fetch data for match ID ${matchId}`, error.message);
        }
    }
    return matchData;
};


app.post('/api/account-data', async (req, res) => {
    const { gameName, tagLine } = req.body;

    try {
        // Step 1: Fetch puuid using account data
        const puuid = await fetchAccountData(gameName, tagLine);

        // Step 2: Fetch match IDs using puuid
        const matchIds = await fetchMatchIds(puuid);

        // Step 3: Fetch detailed match data for each match ID
        const matchData = await fetchAllMatchData(matchIds);

        // Step 4: Transform match data to include only the fields you want
        const transformedMatchData = matchData.map(match => {
            return {
                matchId: match.metadata.matchId,
                participants: match.info.participants.map(participant => ({
                    summonerName: participant.summonerName,
                    championName: participant.championName,
                    goldEarned: participant.goldEarned,
                    totalDamageDealt: participant.totalDamageDealt,
                    championBanned: participant.championBanned, // assuming bans are within each participant's data
                })),
                // Map bans to champion names using championIdToNameMap
                bans: match.info.teams.flatMap(team =>
                    team.bans.map(ban => championIdToNameMap[ban.championId] || 'Unknown Champion')
                )
            };
        });
        // Send the transformed match data as JSON response
        res.json({ matchData: transformedMatchData });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/api/download-csv', async (req, res) => {
    const { data } = req.body;

    const csvWriter = createCsvWriter({
        path: './account_data.csv',
        header: Object.keys(data[0]).map(key => ({ id: key, title: key })),
    });

    await csvWriter.writeRecords(data);
    res.download('./account_data.csv');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});