<template>
  <div id="app">
    <LeagueDataForm /> <!-- Include your LeagueDataForm component -->
  </div>
</template>

<script>
// Import the LeagueDataForm component
import LeagueDataForm from './components/LeagueDataForm.vue'; // Adjust the path if necessary

export default {
  name: 'App',
  components: {
    LeagueDataForm, // Register the LeagueDataForm component
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
