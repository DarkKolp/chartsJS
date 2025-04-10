// src/js/components/NetworkSelector.js
import { appState } from '../state/AppState.js';
import DataService from '../services/DataService.js';

export default class NetworkSelector {
  constructor(container) {
    this.container = container;
  }

  async render() {
    // Clear any existing content
    this.container.innerHTML = '';
    
    // Create selector container
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'selector-container';
    
    // Create heading
    const heading = document.createElement('h2');
    heading.textContent = 'Select a Network';
    heading.className = 'section-heading';
    selectorContainer.appendChild(heading);
    
    // Create selector
    const select = document.createElement('select');
    select.id = 'network-selector';
    select.className = 'network-selector';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Network';
    defaultOption.selected = true;
    select.appendChild(defaultOption);
    
    try {
      // Get available networks
      const networks = await DataService.getAvailableNetworks();
      
      // Add network options
      networks.forEach(network => {
        const option = document.createElement('option');
        option.value = network.name;
        option.textContent = network.name;
        select.appendChild(option);
      });
      
      // Add change event listener
      select.addEventListener('change', async (event) => {
        const networkName = event.target.value;
        if (networkName) {
          // Clear any previous messages
          const existingMsg = selectorContainer.querySelector('.message');
          if (existingMsg) existingMsg.remove();
          
          // Show loading message
          const loadingMsg = document.createElement('div');
          loadingMsg.className = 'message loading-message';
          loadingMsg.textContent = 'Loading...';
          selectorContainer.appendChild(loadingMsg);
          
          try {
            const networkData = await DataService.loadNetworkData(networkName);
            
            // Update app state
            appState.setState({
              selectedNetwork: networkName,
              networkData,
              currentView: 'reportSelection'
            });
            
            // Remove loading message
            loadingMsg.remove();
          } catch (error) {
            // Show error message
            loadingMsg.className = 'message error-message';
            loadingMsg.textContent = 'Failed to load network data';
            console.error('Data loading error:', error);
          }
        }
      });
      
      selectorContainer.appendChild(select);
      this.container.appendChild(selectorContainer);
      
    } catch (error) {
      // Show error if networks can't be loaded
      const errorMsg = document.createElement('div');
      errorMsg.className = 'message error-message';
      errorMsg.textContent = 'Failed to load available networks';
      selectorContainer.appendChild(errorMsg);
      this.container.appendChild(selectorContainer);
      console.error('Network list loading error:', error);
    }
  }
}