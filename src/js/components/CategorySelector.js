// src/js/components/CategorySelector.js
import { appState } from '../state/AppState.js';

export default class CategorySelector {
  constructor(container) {
    this.container = container;
    this.categories = [
      { id: 'economic_security', label: 'Economic Security' },
      { id: 'operators', label: 'Operators' },
      { id: 'vaults', label: 'Vaults' },
      { id: 'curators', label: 'Curators' }
    ];
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
    backButton.textContent = '← Back to Report Selection';
    backButton.addEventListener('click', () => {
      appState.setState({
        currentView: 'reportSelection'
      });
    });
    selectorContainer.appendChild(backButton);
    
    // Network info
    const networkInfo = document.createElement('div');
    networkInfo.className = 'network-info';
    networkInfo.textContent = `${networkData.network.name} - Light Report`;
    selectorContainer.appendChild(networkInfo);
    
    // Heading
    const heading = document.createElement('h2');
    heading.textContent = 'Select Category';
    heading.className = 'section-heading';
    selectorContainer.appendChild(heading);
    
    // Category buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-grid';
    
    this.categories.forEach(category => {
      const button = document.createElement('button');
      button.className = 'category-button';
      button.textContent = category.label;
      
      button.addEventListener('click', () => {
        appState.setState({
          selectedCategory: category.id,
          currentView: 'chartDisplay'
        });
      });
      
      buttonContainer.appendChild(button);
    });
    
    selectorContainer.appendChild(buttonContainer);
    this.container.appendChild(selectorContainer);
  }
}