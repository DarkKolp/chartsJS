// src/js/components/ReportSelector.js
import { appState } from '../state/AppState.js';

export default class ReportSelector {
  constructor(container) {
    this.container = container;
  }

  render() {
    // Clear container
    this.container.innerHTML = '';
    
    const { networkData } = appState.getState();
    
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'selector-container';
    
    // Back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = '← Back to Network Selection';
    backButton.addEventListener('click', () => {
      appState.setState({
        currentView: 'networkSelection'
      });
    });
    selectorContainer.appendChild(backButton);
    
    // Network info
    const networkInfo = document.createElement('div');
    networkInfo.className = 'network-info';
    networkInfo.textContent = `Network: ${networkData.network.name}`;
    selectorContainer.appendChild(networkInfo);
    
    // Heading
    const heading = document.createElement('h2');
    heading.textContent = 'Select Report Type';
    heading.className = 'section-heading';
    selectorContainer.appendChild(heading);
    
    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-group';
    
    // Light report button
    const lightReportBtn = document.createElement('button');
    lightReportBtn.className = 'action-button';
    lightReportBtn.textContent = 'Light Report';
    lightReportBtn.addEventListener('click', () => {
      appState.setState({
        selectedReport: 'light',
        currentView: 'categorySelection'
      });
    });
    
    // Full report button
    const fullReportBtn = document.createElement('button');
    fullReportBtn.className = 'action-button disabled';
    fullReportBtn.textContent = 'Full Report';
    fullReportBtn.addEventListener('click', () => {
      // For now, just show a placeholder as per requirements
      const placeholder = document.createElement('div');
      placeholder.className = 'placeholder';
      placeholder.textContent = 'Full Report is not yet implemented';
      
      // Check if placeholder already exists
      if (!document.querySelector('.placeholder')) {
        buttonContainer.appendChild(placeholder);
      }
    });
    
    buttonContainer.appendChild(lightReportBtn);
    buttonContainer.appendChild(fullReportBtn);
    
    selectorContainer.appendChild(buttonContainer);
    this.container.appendChild(selectorContainer);
  }
}