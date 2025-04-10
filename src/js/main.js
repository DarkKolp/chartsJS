// src/js/main.js
import App from './components/App.js';

// Register the datalabels plugin
Chart.register(ChartDataLabels);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Network Metrics Dashboard');
  new App('app-container');
});