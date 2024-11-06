<template>
    <div>
        <h2>League Data Fetcher</h2>

        <form @submit.prevent="fetchAccountData">
            <input type="text" v-model="account" placeholder="Enter AccountName#TagLine" required />
            <button type="submit">Fetch Account Data</button>
        </form>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <button v-if="tableData.length" @click="downloadCsv">Download Match Data as CSV</button>

        <table v-if="tableData.length">
            <thead>
                <tr>
                    <th v-for="key in Object.keys(tableData[0])" :key="key">{{ key }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in tableData" :key="row.matchId">
                    <td v-for="value in row" :key="value">{{ value }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    data() {
        return {
            account: '',
            errorMessage: '',
            tableData: []
        };
    },
    methods: {
        async fetchAccountData() {
            try {
                // Split the account string into gameName and tagLine
                const [gameName, tagLine] = this.account.split('#');
                
                if (!gameName || !tagLine) {
                    this.errorMessage = 'Invalid account format. Use "AccountName#TagLine".';
                    return;
                }

                // Clear previous data and error message
                this.errorMessage = '';
                this.tableData = [];

                // Fetch account data from the server
                const response = await axios.post('http://localhost:3000/api/account-data', {
                    gameName,
                    tagLine
                });

                // Check if data exists
                if (response.data.matchData.length) {
                    this.tableData = response.data.matchData;
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
                const response = await axios.post('http://localhost:3000/api/download-csv', { data: this.tableData }, { responseType: 'blob' });
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
};
</script>

<style scoped>
.error {
    color: red;
    font-weight: bold;
    margin-top: 10px;
}
</style>
