const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

const { router: matchDataRoutes } = require('./routes/matchData.js'); // Destructure to get the router

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
console.log("Current Working Directory:", process.cwd());
console.log("RiotAPIKEY", process.env.RIOT_API_KEY);

app.get('/api/test', (req, res) => {
    res.send("Test endpoint is working!");
});

app.use((req, res, next) => {
    console.log(`Received ${req.method} request for ${req.url}`);
    next();
});

app.use(cors());
app.use(express.json()); // Enables parsing JSON bodies

// Use match data routes, making them accessible under `/api`
app.use('/api', matchDataRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
