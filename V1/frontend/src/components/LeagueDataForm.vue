<template>
    <div>
        <h2>League Data Fetcher</h2>

        <form @submit.prevent="fetchLeagueData">
            <input type="text" v-model="apiKey" placeholder="Enter API Key" required />

            <select v-model="tier">
                <option v-for="tier in tiers" :key="tier" :value="tier">{{ tier }}</option>
            </select>

            <select v-model="division">
                <option v-for="division in divisions" :key="division" :value="division">{{ division }}</option>
            </select>

            <input type="number" v-model="limit" min="1" max="10" placeholder="Number of entries (1-10)" />

            <button type="submit">Fetch Data</button>
        </form>

        <button v-if="tableData.length" @click="downloadCsv">Download as CSV</button>

        <table v-if="tableData.length">
            <thead>
                <tr>
                    <th v-for="key in Object.keys(tableData[0])" :key="key">{{ key }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in tableData" :key="row.summonerId">
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
            apiKey: '',
            tier: 'IRON',
            division: 'IV',
            limit: 5,
            tiers: ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'],
            divisions: ['IV', 'III', 'II', 'I'],
            tableData: []
        };
    },
    methods: {
        async fetchLeagueData() {
            try {
                const response = await axios.post('http://localhost:3000/api/league-data', {
                    apiKey: this.apiKey,
                    tier: this.tier,
                    division: this.division,
                    limit: this.limit
                });
                this.tableData = response.data.data;
            } catch (error) {
                console.error("Error fetching league data", error);
            }
        },
        async downloadCsv() {
            try {
            const response = await axios.post('http://localhost:3000/api/download-csv', { data: this.tableData }, { responseType: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(new Blob([response.data])); // Now response is defined
            link.download = 'league_data.csv';
            link.click();
        } catch (error) {
            console.error("Error downloading CSV", error);
        }
        }
    }
};
</script>

<style scoped>
/* Add some basic styling */
</style>