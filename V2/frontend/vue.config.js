// frontend/vue.config.js
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  devServer: {
    port: 8080, // Development server port
    open: true, // Open the browser automatically
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Backend server URL
        changeOrigin: true, // Change the origin of the host header
      },
    },
  },
});