// backend/tests/testFetchAccountData.js
require('dotenv').config();

const axios = require('axios')

console.log("Current Working Directory:", process.cwd());
console.log("Riot API Key from .env:", process.env.RIOT_API_KEY);

const { fetchAccountData } = require('../routes/matchData'); // Adjust the path as necessary

const testFetchAccountData = async () => {
    const gameName = "NoTimeForGF"; // Replace with a valid game name
    const tagLine = "00000";    // Replace with a valid tag line
    try {
        const puuid = await fetchAccountData(gameName, tagLine);
        console.log("Test PUUID:", puuid);
    } catch (error) {
        console.error("Error in tests:", error.message);
    }
};

// Execute the test
testFetchAccountData();