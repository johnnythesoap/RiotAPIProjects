<template>
  <div class="container">
    <h2>League Data Fetcher</h2>
    <form @submit.prevent="fetchAccountData" class="form">
      <div class="form-group">
        <input type="text" v-model="account" placeholder="Enter AccountName#TagLine" required />
      </div>
      <div class="form-group">
        <input type="number" v-model="matchCount" placeholder="Number of Matches" min="1" max="20" required />
      </div>
      <button type="submit">Fetch Account Data</button>
    </form>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <button v-if="tableData.length" @click="downloadCsv">Download Match Data as CSV</button>

    <table v-if="tableData.length">
      <thead>
        <tr>
          <!-- Use labels from fields array for headers -->
          <th v-for="field in fields" :key="field.value">{{ field.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in tableData" :key="row.matchId" :class="{'win-true': row.win, 'win-false': !row.win}">
          <!-- Use values from each row to populate the table cells -->
          <td v-for="field in fields" :key="field.value">{{ row[field.value] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import axios from 'axios';

export default defineComponent({
  data() {
    return {
      account: '',
      errorMessage: '',
      tableData: [],
      matchCount: 0,
      fields: [
        { label: 'Player Name', value: 'playerName' },
        { label: 'Champion Name', value: 'championName' },
        { label: 'Gold Earned', value: 'goldEarned' },
        { label: 'Total Damage Dealt', value: 'totalDamageDealt' },
        { label: 'Kills', value: 'kills' },
        { label: 'Deaths', value: 'deaths' },
        { label: 'Assists', value: 'assists' },
        { label: 'Match ID', value: 'matchId' }
      ]
    };
  },
  mounted() {
    document.title = 'Account Data Fetcher';
  },
  methods: {
    async fetchAccountData() {
      try {
        const [gameName, tagLine] = this.account.split('#');
        const matchCount = this.matchCount;

        if (!gameName || !tagLine) {
          this.errorMessage = 'Invalid account format. Use "AccountName#TagLine".';
          return;
        }

        this.errorMessage = '';
        this.tableData = [];

        const response = await axios.post('http://localhost:5000/api/account-data', {
          gameName,
          tagLine,
          matchCount
        });

        if (response.data.matchData.length) {
          // Transform response data to include only required fields for table display
          this.tableData = response.data.matchData.map(match => ({
            playerName: match.playerName,
            championName: match.championName,
            goldEarned: match.goldEarned,
            totalDamageDealt: match.totalDamageDealt,
            kills: match.kills,
            deaths: match.deaths,
            assists: match.assists,
            matchId: match.matchId,
            win: match.win
          }));
          document.title = `${gameName}#${tagLine}`;
        } else {
          this.errorMessage = 'No match data found for this account.';
        }
      } catch (error) {
        this.errorMessage = 'Account not found or an error occurred while fetching data.';
        console.error("Error fetching account data", error);
      }
    },
    async downloadCsv() {
      try {
        const response = await axios.post('http://localhost:5000/api/download-csv', { data: this.tableData }, { responseType: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([response.data]));
        link.download = 'account_data.csv';
        link.click();
      } catch (error) {
        this.errorMessage = 'Error downloading CSV';
        console.error("Error downloading CSV", error);
      }
    }
  }
});
</script>

<style>
/* Set the entire page to dark mode */
body {
  background-color: #38343c; /* Dark mode background */
  color: #ffffff; /* Default text color for readability */
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 50px;
}

h2 {
  color: #ffffff;
}

.form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.form-group {
  margin-bottom: 15px;
}

/* Input fields: White background with gray text */
input {
  width: 300px;
  padding: 10px;
  font-size: 16px;
  color: #4a4a4a; /* Gray text color */
  background-color: #ffffff; /* White input background */
  border: 1px solid #777; /* Light border */
}

button {
  width: 200px;
  padding: 10px;
  font-size: 16px;
  margin-top: 10px;
  cursor: pointer;
  color: #ffffff;
  background-color: #5884ec;
  border: none;
}

.error {
  color: #ff4c4c; /* Red for error text */
  font-weight: bold;
  margin-top: 10px;
}


table {
  width: 100%; 
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 12px 15px; 
  border: 1px solid #555555; 
  text-align: left; 
}

th {
  background-color: #5884ec; /* Header background color */
  color: #ffffff; /* Header text color */
  font-weight: bold;
}

td {
  color: #9191a8; /* Cell text color */
}

tr.win-true {
  background-color: #2F436E; /* Blue for wins */
}

tr.win-false {
  background-color: #703C47; /* Red for losses */
}

/* Alternating row colors for readability */
tr:nth-child(even):not(.win-true):not(.win-false) {
  background-color: #4a4a4a; /* Slightly lighter gray for non win/loss rows */
}

tr:hover {
  background-color: #5a5a5a; /* Hover effect for rows */
}
</style>
