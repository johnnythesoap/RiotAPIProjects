<template>
  <div class="container">
    <h2>League Data Fetcher</h2>
    <form @submit.prevent="fetchAccountData" class="form">
      <div class="form-group">
        <input
          type="text"
          v-model="account"
          placeholder="Enter AccountName#TagLine"
          required
        />
      </div>
      <div class="form-group">
        <input
          type="number"
          v-model="matchCount"
          placeholder="Number of Matches"
          min="1"
          max="20"
          required
        />
      </div>
      <button type="submit">Fetch Account Data</button>
    </form>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <button v-if="tableData.length" @click="downloadCsv">
      Download Match Data as CSV
    </button>

    <table v-if="tableData.length">
      <thead>
        <tr>
          <!-- Use labels from fields array for headers -->
          <th v-for="field in fields" :key="field.value">{{ field.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in tableData"
          :key="row.matchId"
          :class="{ 'win-true': row.win, 'win-false': !row.win }"
        >
          <!-- Use values from each row to populate the table cells -->
          <td v-for="field in fields" :key="field.value">
            {{ row[field.value] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import axios from "axios";

// Import the CSS file
import "@/assets/styles/leagueDataFetcher.css";

export default defineComponent({
  data() {
    return {
      account: "",
      errorMessage: "",
      tableData: [],
      matchCount: 0,
      fields: [
        { label: "Player Name", value: "playerName" },
        { label: "Champion Name", value: "championName" },
        { label: "Gold Earned", value: "goldEarned" },
        { label: "Total Damage Dealt", value: "totalDamageDealt" },
        { label: "Kills", value: "kills" },
        { label: "Deaths", value: "deaths" },
        { label: "Assists", value: "assists" },
        { label: "Match ID", value: "matchId" },
      ],
    };
  },
  mounted() {
    document.title = "Account Data Fetcher";
  },
  methods: {
    async fetchAccountData() {
      try {
        const [gameName, tagLine] = this.account.split("#");
        const matchCount = this.matchCount;

        if (!gameName || !tagLine) {
          this.errorMessage =
            'Invalid account format. Use "AccountName#TagLine".';
          return;
        }

        this.errorMessage = "";
        this.tableData = [];

        const response = await axios.post(
          "http://localhost:5000/api/account-data",
          {
            gameName,
            tagLine,
            matchCount,
          }
        );

        if (response.data.matchData.length) {
          // Transform response data to include only required fields for table display
          this.tableData = response.data.matchData.map((match) => ({
            playerName: match.playerName,
            championName: match.championName,
            goldEarned: match.goldEarned,
            totalDamageDealt: match.totalDamageDealt,
            kills: match.kills,
            deaths: match.deaths,
            assists: match.assists,
            matchId: match.matchId,
            win: match.win,
          }));
          document.title = `${gameName}#${tagLine}`;
        } else {
          this.errorMessage = "No match data found for this account.";
        }
      } catch (error) {
        this.errorMessage =
          "Account not found or an error occurred while fetching data.";
        console.error("Error fetching account data", error);
      }
    },
    async downloadCsv() {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/download-csv",
          { data: this.tableData },
          { responseType: "blob" }
        );
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([response.data]));
        link.download = "account_data.csv";
        link.click();
      } catch (error) {
        this.errorMessage = "Error downloading CSV";
        console.error("Error downloading CSV", error);
      }
    },
  },
});
</script>
