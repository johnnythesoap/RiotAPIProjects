// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Parser } = require('json2csv');
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Use the Riot API key from environment variables
const riotApiKey = process.env.RIOT_API_KEY;
console.log("Riot API Key:", riotApiKey); // Log the Riot API key to verify it's loaded
console.log("Current Working Directory:", process.cwd());

// Helper functions to construct Riot API URLs
const leagueV4 = (tier, division) => `https://euw1.api.riotgames.com/lol/league/v4/entries/RANKED_SOLO_5x5/${tier}/${division}?api_key=${riotApiKey}`;
const summonerV4 = (summonerId) => `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}?api_key=${riotApiKey}`;
const matchV5MatchIds = (puuid) => `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&api_key=${riotApiKey}`;
const matchV5MatchData = (matchId) => `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${riotApiKey}`;
const accountV1ByRiotId = (gameName, tagLine) => `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}?api_key=${riotApiKey}`;
const ddragonChampionData = `https://ddragon.leagueoflegends.com/cdn/13.1.1/data/en_US/champion.json`;

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
    console.log("Fetching account data from URL:", url);
    try {
        const response = await axios.get(url);
        return response.data.puuid; // Return only puuid
    } catch (error) {
        console.error('Error fetching account data:', error.response ? error.response.data : error.message);
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

// Helper function to fetch all match data by match IDs
const fetchAllMatchData = async (matchIds) => {
    const matchData = [];
    for (const matchId of matchIds) {
        try {
            const data = await fetchMatchData(matchId);
            matchData.push(data);
            await delay(100); 
        } catch (error) {
            console.error(`Failed to fetch data for match ID ${matchId}`, error.message);
        }
    }
    return matchData;
};

router.post('/account-data', async (req, res) => {
    console.log("Received a POST request to /api/account-data"); 
    console.log("Request Body:", req.body);

    const { gameName, tagLine, matchCount } = req.body;
    console.log("Game Name:", gameName, "Tag Line:", tagLine, "Match Count:", matchCount);

    const numberOfMatches = parseInt(matchCount) || 1;

    try {
        // Step 1: Fetch puuid using account data
        const puuid = await fetchAccountData(gameName, tagLine);
        console.log("Fetched PUUID:", puuid);

        // Step 2: Fetch match IDs using puuid
        const matchIds = await fetchMatchIds(puuid);
        const limitedMatchIds = matchIds.slice(0, numberOfMatches);

        // Step 3: Fetch detailed match data for each match ID
        const matchData = await fetchAllMatchData(limitedMatchIds);

        // Step 4: Transform match data to include only the fields you want
        const transformedMatchData = matchData.map(match => {
            const participant = match.info.participants.find(p => p.puuid === puuid);
            return {
                playerName: `${gameName}#${tagLine}`,
                championName: participant.championName,
                goldEarned: participant.goldEarned,
                totalDamageDealt: participant.totalDamageDealt,
                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists,
                win: participant.win,
                matchId: match.metadata.matchId,
                // championBanned: participant.championBanned, // assuming bans are within each participant's data
                // Map bans to champion names using championIdToNameMap
                // bans: match.info.teams.flatMap(team => team.bans.map(ban => championIdToNameMap[ban.championId] || 'No ban')),
            };
        });
        
        // Send the transformed match data as JSON response
        res.json({ matchData: transformedMatchData });
    } catch (error) {
        console.error("Error:", error); // Log error details
        res.status(500).send(error.message);
    }
});

// New route for downloading match data as CSV
router.post('/download-csv', async (req, res) => {
    const { data } = req.body; // Retrieve the match data from the request body

    if (!data || !data.length) {
        return res.status(400).send("No data available for CSV download.");
    }

    try {
        // Define fields you want to include in the CSV
        const fields = [
            { label: 'Player Name', value: 'playerName' },
            { label: 'Champion Name', value: 'championName' },
            { label: 'Gold Earned', value: 'goldEarned' },
            { label: 'Total Damage Dealt', value: 'totalDamageDealt' },
            { label: 'Kills', value: 'kills' },
            { label: 'Deaths', value: 'deaths' },
            { label: 'Assists', value: 'assists' },
            { label: 'Match ID', value: 'matchId' }
        ];

        const opts = { fields };
        const parser = new Parser(opts);
        const csv = parser.parse(data); // Convert JSON to CSV

        // Set the response headers to prompt a file download
        res.header('Content-Type', 'text/csv');
        res.attachment('match_data.csv'); // Suggest a filename for the download
        res.send(csv); // Send the CSV file data

    } catch (error) {
        console.error('Error generating CSV:', error.message);
        res.status(500).send('Error generating CSV');
    }
});

router.get('/test', (req, res) => {
    res.send('Test route is working!');
});

// Unified exports
module.exports = {
    router, // Exporting the router
    fetchAccountData, // Exporting the fetchAccountData function
    // Add any other exports you need here
};
