import { createApp } from 'vue';
import App from './App.vue';
import axios from 'axios';

const app = createApp(App);

// Create an axios instance
const axiosInstance = axios.create({
    baseURL: process.env.VUE_APP_API_URL || 'http://localhost:5000/api',
});

// Provide axios to the entire app
app.config.globalProperties.$axios = axiosInstance;

app.mount('#app');