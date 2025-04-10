// src/js/main.js
import App from './components/App.js';
// Removed import { PieCalloutPlugin } from './plugins/pieCalloutPlugin.js';

// Register required plugins globally
// Datalabels plugin is loaded and registered via CDN in index.html
// PieCalloutPlugin will be registered locally in ChartDisplay.js
// Chart.register(PieCalloutPlugin); // REMOVED

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Network Metrics Dashboard');
  new App('app-container');
});