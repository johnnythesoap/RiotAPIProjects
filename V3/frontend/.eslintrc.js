module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
  ],
  parserOptions: {
    parser: '@babel/eslint-parser', // Keep this if you're using Babel parser
  },
  rules: {
    // Define any custom rules here
  },
};
