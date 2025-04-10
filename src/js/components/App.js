// src/js/components/App.js
import { appState } from '../state/AppState.js';
import NetworkSelector from './NetworkSelector.js';
import ReportSelector from './ReportSelector.js';
import CategorySelector from './CategorySelector.js';
import ChartDisplay from './ChartDisplay.js';

export default class App {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    
    if (!this.container) {
      console.error(`Container element with ID "${containerId}" not found!`);
      return;
    }
    
    this.init();
  }

  init() {
    // Initial render
    this.render();
    
    // Subscribe to state changes
    appState.subscribe(state => {
      console.log('App state updated:', state);
      this.render();
    });
  }

  render() {
    // Get current view from state
    const { currentView } = appState.getState();
    
    // Clear container
    this.container.innerHTML = '';
    
    // Render appropriate component based on current view
    switch (currentView) {
      case 'networkSelection':
        new NetworkSelector(this.container).render();
        break;
        
      case 'reportSelection':
        new ReportSelector(this.container).render();
        break;
        
      case 'categorySelection':
        new CategorySelector(this.container).render();
        break;
        
      case 'chartDisplay':
        new ChartDisplay(this.container).render();
        break;
        
      default:
        // Default to network selection
        new NetworkSelector(this.container).render();
    }
  }
}