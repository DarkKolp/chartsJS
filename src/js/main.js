// src/js/main.js
import App from './components/App.js';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Network Metrics Dashboard');
  new App('app-container');
});